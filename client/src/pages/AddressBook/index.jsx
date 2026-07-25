import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const AddressBook = () => {
  const [addresses, setAddresses] = useState([
    { id: 1, type: 'Home', street: '123 Fashion Ave', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India', isDefault: true }
  ]);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-playfair font-bold text-charcoal-900">Address Book</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Cancel' : 'Add New Address'}</Button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
          <h2 className="text-xl font-medium mb-4">New Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Street Address" />
            <Input label="City" />
            <Input label="State" />
            <Input label="Postal Code" />
            <Input label="Country" />
            <div className="md:col-span-2 pt-4">
              <Button onClick={() => setIsAdding(false)}>Save Address</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div key={address.id} className="border border-gray-200 rounded-lg p-6 relative">
            {address.isDefault && (
              <span className="absolute top-4 right-4 bg-gold-100 text-gold-800 text-xs px-2 py-1 rounded-full font-medium">Default</span>
            )}
            <h3 className="font-medium text-lg mb-2">{address.type}</h3>
            <p className="text-gray-600 mb-1">{address.street}</p>
            <p className="text-gray-600 mb-4">{address.city}, {address.state} {address.zipCode}, {address.country}</p>
            <div className="flex gap-4">
              <button className="text-gold-600 hover:text-gold-700 font-medium text-sm">Edit</button>
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressBook;
