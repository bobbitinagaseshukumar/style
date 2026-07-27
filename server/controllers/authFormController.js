const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

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
  const count = await prisma.authFormField.count();
  if (count === 0) {
    for (const f of DEFAULT_FIELDS) {
      await prisma.authFormField.create({ data: f });
    }
  }
};

// ==================== GET PUBLIC ENABLED FORM FIELDS ====================
exports.getPublicAuthFields = asyncHandler(async (req, res) => {
  await seedDefaultsIfEmpty();

  const formType = req.query.formType || 'REGISTER';
  const fields = await prisma.authFormField.findMany({
    where: { isEnabled: true, formType },
    orderBy: { sortOrder: 'asc' }
  });

  res.status(200).json({ success: true, data: fields });
});

// ==================== GET ADMIN ALL FORM FIELDS ====================
exports.getAdminAuthFields = asyncHandler(async (req, res) => {
  await seedDefaultsIfEmpty();

  const fields = await prisma.authFormField.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  res.status(200).json({ success: true, data: fields });
});

// ==================== CREATE NEW CUSTOM FIELD ====================
exports.createAuthField = asyncHandler(async (req, res) => {
  const { fieldKey, label, placeholder, helperText, type, isRequired, isEnabled, validationRules, formType } = req.body;

  if (!fieldKey || !label) {
    return res.status(400).json({ success: false, message: 'Field key and label are required' });
  }

  const existing = await prisma.authFormField.findUnique({ where: { fieldKey } });
  if (existing) {
    return res.status(400).json({ success: false, message: `Field with key "${fieldKey}" already exists` });
  }

  const maxOrder = await prisma.authFormField.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder || 0) + 1;

  const field = await prisma.authFormField.create({
    data: {
      fieldKey: fieldKey.trim().replace(/\s+/g, ''),
      label: label.trim(),
      placeholder: placeholder || '',
      helperText: helperText || '',
      type: type || 'text',
      isRequired: isRequired ?? false,
      isEnabled: isEnabled ?? true,
      formType: formType || 'REGISTER',
      sortOrder: nextOrder,
      validationRules: typeof validationRules === 'object' ? JSON.stringify(validationRules) : validationRules
    }
  });

  res.status(201).json({ success: true, message: 'Custom field created successfully', data: field });
});

// ==================== UPDATE AUTH FORM FIELD ====================
exports.updateAuthField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, placeholder, helperText, type, isRequired, isEnabled, validationRules, sortOrder } = req.body;

  let field = await prisma.authFormField.findUnique({ where: { id } });
  if (!field) {
    return res.status(404).json({ success: false, message: 'Form field not found' });
  }

  field = await prisma.authFormField.update({
    where: { id },
    data: {
      ...(label && { label }),
      ...(placeholder !== undefined && { placeholder }),
      ...(helperText !== undefined && { helperText }),
      ...(type && { type }),
      ...(isRequired !== undefined && { isRequired }),
      ...(isEnabled !== undefined && { isEnabled }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(validationRules !== undefined && {
        validationRules: typeof validationRules === 'object' ? JSON.stringify(validationRules) : validationRules
      })
    }
  });

  res.status(200).json({ success: true, message: 'Form field updated successfully', data: field });
});

// ==================== DELETE AUTH FORM FIELD ====================
exports.deleteAuthField = asyncHandler(async (req, res) => {
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
  res.status(200).json({ success: true, message: 'Form field deleted successfully' });
});

// ==================== REORDER FORM FIELDS ====================
exports.reorderAuthFields = asyncHandler(async (req, res) => {
  const { fieldOrders } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(fieldOrders)) {
    return res.status(400).json({ success: false, message: 'fieldOrders array is required' });
  }

  for (const item of fieldOrders) {
    await prisma.authFormField.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder }
    });
  }

  res.status(200).json({ success: true, message: 'Fields reordered successfully' });
});
