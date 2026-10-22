import React from 'react';
export interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    version: string | null;
    notes: string;
}
export declare const UpdateModal: React.FC<UpdateModalProps>;
