interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  isOpen?: boolean;
}

export const Modal = ({ children, onClose, title, isOpen = true }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-200 max-h-200 overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
