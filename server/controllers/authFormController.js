const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Ensure AuthFormField table exists in PostgreSQL
const ensureAuthFormFieldTable = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuthFormField" (
        "id" TEXT NOT NULL,
        "formType" TEXT NOT NULL DEFAULT 'REGISTER',
        "fieldKey" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "placeholder" TEXT,
        "helperText" TEXT,
        "type" TEXT NOT NULL DEFAULT 'text',
        "isRequired" BOOLEAN NOT NULL DEFAULT false,
        "isEnabled" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "validationRules" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuthFormField_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AuthFormField_fieldKey_key" ON "AuthFormField"("fieldKey");
    `);
  } catch (err) {
    console.warn('[AUTH FORM FIELD SCHEMA SYNC]:', err.message);
  }
};

exports.ensureAuthFormFieldTable = ensureAuthFormFieldTable;

// Default initial registration fields if table is empty
const DEFAULT_FIELDS = [
  { fieldKey: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text', isRequired: true, isEnabled: true, sortOrder: 1, helperText: 'Enter your legal first & last name', validationRules: JSON.stringify({ minLength: 3, maxLength: 50 }) },
  { fieldKey: 'email', label: 'Email Address', placeholder: 'name@domain.com', type: 'email', isRequired: true, isEnabled: true, sortOrder: 2, helperText: 'Must be a valid unique email address', validationRules: JSON.stringify({ pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', patternMsg: 'Please enter a valid email address.' }) },
  { fieldKey: 'mobile', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', isRequired: true, isEnabled: true, sortOrder: 3, helperText: '10-digit mobile number for order SMS alerts', validationRules: JSON.stringify({ minLength: 10, maxLength: 10, pattern: '^[0-9]{10}$', patternMsg: 'Mobile number must contain exactly 10 digits.' }) },
  { fieldKey: 'password', label: 'Password', placeholder: '••••••••••••', type: 'password', isRequired: true, isEnabled: true, sortOrder: 4, helperText: 'At least 6 characters', validationRules: JSON.stringify({ minLength: 6 }) },
  { fieldKey: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••••••', type: 'password', isRequired: true, isEnabled: true, sortOrder: 5, helperText: 'Must match password', validationRules: JSON.stringify({}) },
  { fieldKey: 'gender', label: 'Gender', placeholder: 'Select Gender', type: 'select', isRequired: false, isEnabled: true, sortOrder: 6, helperText: 'Optional', validationRules: JSON.stringify({ options: ['Male', 'Female', 'Other', 'Prefer not to say'] }) },
  { fieldKey: 'referralCode', label: 'Referral Code', placeholder: 'REF100', type: 'text', isRequired: false, isEnabled: true, sortOrder: 7, helperText: 'Optional promo code', validationRules: JSON.stringify({}) },
];

// Helper to seed defaults if empty
const seedDefaultsIfEmpty = async () => {
  await ensureAuthFormFieldTable();
  try {
    const count = await prisma.authFormField.count();
    if (count === 0) {
      for (const f of DEFAULT_FIELDS) {
        try {
          await prisma.authFormField.create({ data: { id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, ...f } });
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('[SEED AUTH FORM FIELDS WARN]:', err.message);
  }
};

// Sync with AuthSettings.formFields
const syncToAuthSettings = async () => {
  try {
    const allFields = await prisma.authFormField.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    const standardFieldsFormat = allFields.map(f => ({
      name: f.fieldKey,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder || '',
      required: f.isRequired,
      enabled: f.isEnabled,
      helperText: f.helperText || '',
    }));

    await prisma.authSettings.upsert({
      where: { id: 'default' },
      update: { formFields: JSON.stringify(standardFieldsFormat) },
      create: { id: 'default', formFields: JSON.stringify(standardFieldsFormat) },
    });
  } catch (syncErr) {
    console.warn('[AUTH SETTINGS SYNC WARN]:', syncErr.message);
  }
};

// ==================== GET PUBLIC ENABLED FORM FIELDS ====================
exports.getPublicAuthFields = asyncHandler(async (req, res) => {
  await seedDefaultsIfEmpty();

  const formType = req.query.formType || 'REGISTER';
  try {
    const fields = await prisma.authFormField.findMany({
      where: { isEnabled: true, formType },
      orderBy: { sortOrder: 'asc' }
    });
    return res.status(200).json({ success: true, data: fields });
  } catch (dbErr) {
    console.warn('[GET PUBLIC AUTH FIELDS FALLBACK]:', dbErr.message);
    return res.status(200).json({ success: true, data: DEFAULT_FIELDS.filter(f => f.isEnabled) });
  }
});

// ==================== GET ADMIN ALL FORM FIELDS ====================
exports.getAdminAuthFields = asyncHandler(async (req, res) => {
  await seedDefaultsIfEmpty();

  try {
    const fields = await prisma.authFormField.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return res.status(200).json({ success: true, data: fields });
  } catch (dbErr) {
    console.warn('[GET ADMIN AUTH FIELDS FALLBACK]:', dbErr.message);
    return res.status(200).json({ success: true, data: DEFAULT_FIELDS });
  }
});

// ==================== CREATE NEW CUSTOM FIELD ====================
exports.createAuthField = asyncHandler(async (req, res) => {
  await ensureAuthFormFieldTable();
  const { fieldKey, label, placeholder, helperText, type, isRequired, isEnabled, validationRules, formType } = req.body;

  if (!fieldKey || !label) {
    return res.status(400).json({ success: false, message: 'Field key and label are required' });
  }

  const cleanKey = fieldKey.trim().replace(/\s+/g, '');
  const existing = await prisma.authFormField.findFirst({ where: { fieldKey: cleanKey } });
  if (existing) {
    return res.status(400).json({ success: false, message: `Field with key "${cleanKey}" already exists` });
  }

  let nextOrder = 1;
  try {
    const maxOrder = await prisma.authFormField.aggregate({ _max: { sortOrder: true } });
    nextOrder = (maxOrder._max.sortOrder || 0) + 1;
  } catch (e) {}

  const field = await prisma.authFormField.create({
    data: {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fieldKey: cleanKey,
      label: label.trim(),
      placeholder: placeholder || '',
      helperText: helperText || '',
      type: type || 'text',
      isRequired: Boolean(isRequired),
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      formType: formType || 'REGISTER',
      sortOrder: nextOrder,
      validationRules: typeof validationRules === 'object' ? JSON.stringify(validationRules) : (validationRules || '{}')
    }
  });

  await syncToAuthSettings();

  res.status(201).json({ success: true, message: 'Custom field created successfully in database', data: field });
});

// ==================== UPDATE AUTH FORM FIELD ====================
exports.updateAuthField = asyncHandler(async (req, res) => {
  await ensureAuthFormFieldTable();
  const { id } = req.params;
  const { label, placeholder, helperText, type, isRequired, isEnabled, validationRules, sortOrder } = req.body;

  let field = await prisma.authFormField.findUnique({ where: { id } });
  if (!field) {
    return res.status(404).json({ success: false, message: 'Form field not found' });
  }

  field = await prisma.authFormField.update({
    where: { id },
    data: {
      ...(label && { label: label.trim() }),
      ...(placeholder !== undefined && { placeholder }),
      ...(helperText !== undefined && { helperText }),
      ...(type && { type }),
      ...(isRequired !== undefined && { isRequired: Boolean(isRequired) }),
      ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      ...(validationRules !== undefined && {
        validationRules: typeof validationRules === 'object' ? JSON.stringify(validationRules) : validationRules
      })
    }
  });

  await syncToAuthSettings();

  res.status(200).json({ success: true, message: 'Form field updated successfully in database', data: field });
});

// ==================== DELETE AUTH FORM FIELD ====================
exports.deleteAuthField = asyncHandler(async (req, res) => {
  await ensureAuthFormFieldTable();
  const { id } = req.params;

  const field = await prisma.authFormField.findUnique({ where: { id } });
  if (!field) {
    return res.status(404).json({ success: false, message: 'Form field not found' });
  }

  // Prevent deleting primary essential fields
  if (['email', 'password'].includes(field.fieldKey)) {
    return res.status(400).json({ success: false, message: 'Cannot delete mandatory authentication system fields' });
  }

  await prisma.authFormField.delete({ where: { id } });
  await syncToAuthSettings();

  res.status(200).json({ success: true, message: 'Form field deleted successfully from database' });
});

// ==================== REORDER FORM FIELDS ====================
exports.reorderAuthFields = asyncHandler(async (req, res) => {
  await ensureAuthFormFieldTable();
  const { fieldOrders } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(fieldOrders)) {
    return res.status(400).json({ success: false, message: 'fieldOrders array is required' });
  }

  for (const item of fieldOrders) {
    try {
      await prisma.authFormField.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      });
    } catch (e) {}
  }

  await syncToAuthSettings();

  res.status(200).json({ success: true, message: 'Fields reordered and persisted to database successfully' });
});
