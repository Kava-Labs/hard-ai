import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';
import { ButtonIcon } from 'lib-kava-ai';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <ButtonIcon icon={X} aria-label={'Close modal'} onClick={onClose} />
        </div>
        <div className={styles.modalContent}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

export const ModalButton: React.FC<
  React.PropsWithChildren<{
    className?: string;
    modalTitle: string;
    modalContent: string;
  }>
> = ({ children, modalTitle, modalContent, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <button className={className} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      {isOpen && (
        <Modal title={modalTitle} onClose={() => setIsOpen(false)}>
          {modalContent}
        </Modal>
      )}
    </>
  );
};
