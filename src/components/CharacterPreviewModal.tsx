// CharacterPreviewModal.tsx
import { useState } from 'react';
import { deleteEntity } from '../deleteCharOrConv'
import '../styles/CharacterPreviewModal.css'

type CharacterPreviewProps = {
  id: string; // 👈 Add this
  name: string;
  description: string;
  imageUrl: string;
  private: boolean;
  onClose: () => void;
  onDelete: ( deletedId: string ) => void;
};

export default function CharacterPreviewModal({ id, name, description, imageUrl, private: isPrivate, onClose, onDelete }: CharacterPreviewProps) {
    
    const [isDeleting, setIsDeleting] = useState(false);

    return (
      <div className="mybot-modal-overlay" onClick={onClose}>
        <div className="character-preview-modal" onClick={(e) => e.stopPropagation()}>
          
          {/* ❌ Close icon */}
          <button className="modal-close-button" onClick={onClose} title="Close">
            &times;
          </button>
  
          <img src={imageUrl} alt={name} className="character-preview-image" />
          <h2>{name}</h2>
          {/* NEW: Private Status */}
          <p className={`character-private-status ${isPrivate ? 'private' : 'public'}`}>
            {isPrivate ? '🔒 Private' : '🌐 Public'}
            </p>
          <p className="character-preview-description">{description}</p>

          <div className="modal-button-group">
          <button
            className="primary-button delete-button"
            disabled={isDeleting}
            onClick={async () => {
                try {
                setIsDeleting(true);
                await deleteEntity({ entity_id: id, entity_type: 'character' });
                onDelete(id);
                } catch (err) {
                console.error('Failed to delete:', err);
                } finally {
                setIsDeleting(false);
                }
            }}
            >
            {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
