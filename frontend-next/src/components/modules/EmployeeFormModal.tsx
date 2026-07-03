'use client';

import React, { useState, useEffect } from 'react';
import { FormModal, FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { platformApi } from '@/services/api/platform-api';
import type { EmployeeRecord } from '@/types/platform';

type EmployeeFormModalProps = {
 open: boolean;
 onClose: () => void;
 employeeToEdit?: EmployeeRecord | null;
 onSuccess?: () => void;
};

export function EmployeeFormModal({ open, onClose, employeeToEdit, onSuccess }: EmployeeFormModalProps) {
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
 firstName: '',
 lastName: '',
 workEmail: '',
 personalEmail: '',
 phone: '',
 department: 'Engineering',
 designation: '',
 status: 'Active',
 monthlyCtc: '',
 joinDate: new Date().toISOString().split('T')[0],
 });

 useEffect(() => {
 if (open) {
 if (employeeToEdit) {
 const [firstName, ...lastNames] = employeeToEdit.name.split(' ');
 setFormData({
 firstName: firstName || '',
 lastName: lastNames.join(' ') || '',
 workEmail: '',
 personalEmail: '',
 phone: '',
 department: employeeToEdit.department || 'Engineering',
 designation: employeeToEdit.designation || '',
 status: employeeToEdit.status || 'Active',
 monthlyCtc: '',
 joinDate: new Date().toISOString().split('T')[0],
 });
 } else {
 setFormData({
 firstName: '',
 lastName: '',
 workEmail: '',
 personalEmail: '',
 phone: '',
 department: 'Engineering',
 designation: '',
 status: 'Active',
 monthlyCtc: '',
 joinDate: new Date().toISOString().split('T')[0],
 });
 }
 }
 }, [open, employeeToEdit]);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setFormData((prev) => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async () => {
 setLoading(true);
 try {
 if (employeeToEdit) {
 // Mock update API call
 // await platformApi.updateEmployee(employeeToEdit.id, formData);
 await new Promise((resolve) => setTimeout(resolve, 800));
 } else {
 // Mock create API call
 // await platformApi.createEmployee(formData);
 await new Promise((resolve) => setTimeout(resolve, 800));
 }
 onSuccess?.();
 onClose();
 } catch (error) {
 console.error('Failed to save employee:', error);
 } finally {
 setLoading(false);
 }
 };

 return (
 <FormModal
 open={open}
 onClose={onClose}
 title={employeeToEdit ? 'Edit Employee Profile' : 'Add New Employee'}
 subtitle={employeeToEdit ? `Updating profile for ${employeeToEdit.name}` : 'Create a new employee record and onboard them.'}
 maxWidth="lg"
 loading={loading}
 footer={
 <>
 <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
 <PrimaryButton onClick={handleSubmit} loading={loading}>
 {employeeToEdit ? 'Save Changes' : 'Create Employee'}
 </PrimaryButton>
 </>
 }
 >
 <div className="grid grid-cols-2 gap-4">
 <FieldGroup label="First Name" required>
 <ModalInput name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
 </FieldGroup>
 <FieldGroup label="Last Name">
 <ModalInput name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
 </FieldGroup>
 
 <FieldGroup label="Work Email" required>
 <ModalInput type="email" name="workEmail" value={formData.workEmail} onChange={handleChange} placeholder="john.doe@akuldravin.ai" />
 </FieldGroup>
 <FieldGroup label="Phone Number">
 <ModalInput name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" />
 </FieldGroup>

 <FieldGroup label="Department" required>
 <ModalSelect name="department" value={formData.department} onChange={handleChange}>
 <option value="Engineering">Engineering</option>
 <option value="Finance">Finance</option>
 <option value="HR">HR</option>
 <option value="Operations">Operations</option>
 <option value="Sales">Sales</option>
 <option value="General">General</option>
 </ModalSelect>
 </FieldGroup>
 <FieldGroup label="Designation" required>
 <ModalInput name="designation" value={formData.designation} onChange={handleChange} placeholder="Senior Software Engineer" />
 </FieldGroup>

 <FieldGroup label="Status" required>
 <ModalSelect name="status" value={formData.status} onChange={handleChange}>
 <option value="Active">Active</option>
 <option value="On Leave">On Leave</option>
 <option value="Probation">Probation</option>
 </ModalSelect>
 </FieldGroup>
 <FieldGroup label="Join Date" required>
 <ModalInput type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} />
 </FieldGroup>

 <FieldGroup label="Monthly CTC (USD)">
 <ModalInput type="number" name="monthlyCtc" value={formData.monthlyCtc} onChange={handleChange} placeholder="5000" />
 </FieldGroup>
 </div>
 </FormModal>
 );
}
