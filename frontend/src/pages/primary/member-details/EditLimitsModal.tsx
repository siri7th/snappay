// src/pages/primary/member-details/EditLimitsModal.tsx
import React from 'react';
import LimitSetter from '../../../components/family/LimitSetter';

interface EditLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  initialValues: any;
  onSubmit: (data: any) => Promise<void>;
}

export const EditLimitsModal: React.FC<EditLimitsModalProps> = ({
  isOpen,
  onClose,
  memberName,
  initialValues,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <LimitSetter
          memberName={memberName}
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};