import React from 'react';
import { InformationList } from '../components';
import type { Information } from '../types';

interface InformationPageProps {
    information: Information[];
    onEdit: (info: Information) => void;
    onDelete: (id: string) => void;
}

export const InformationPage: React.FC<InformationPageProps> = ({
    information,
    onEdit,
    onDelete
}) => {
    return (
        <InformationList
            information={information.filter(info => !info.isDeleted)}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
};
