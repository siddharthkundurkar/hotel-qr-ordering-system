export default function QRCodeModal({ table, onClose }) {
  if (!table) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 text-center">
        <h2 className="text-lg font-semibold mb-4">
          QR - Table {table.tableNumber}
        </h2>

        {/* 🔥 SHOW QR IMAGE FROM BACKEND */}
        <img
          src={table.qrCode}
          alt="Table QR"
          className="mx-auto w-52 h-52 object-contain"
        />

        <button
          onClick={onClose}
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
