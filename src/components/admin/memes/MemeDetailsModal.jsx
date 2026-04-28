import { X } from 'lucide-react';

export default function MemeDetailsModal({ meme, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Meme Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">User</h3>
            <div className="flex items-center gap-3">
              {meme.user?.profilePicUrl ? (
                <img
                  src={meme.user.profilePicUrl}
                  alt={meme.user.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-lg">
                    {meme.user?.fullName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{meme.user?.fullName || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{meme.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
            <p className="text-gray-900">{meme.title}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Content</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{meme.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Content Category</h3>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {meme.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Posting Category</h3>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                {meme.postingCategory}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Likes</h3>
              <p className="text-gray-900">{meme.likesCount || 0}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
              <p className="text-gray-900">
                {new Date(meme.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {meme.updatedAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Updated At</h3>
              <p className="text-gray-900">
                {new Date(meme.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}