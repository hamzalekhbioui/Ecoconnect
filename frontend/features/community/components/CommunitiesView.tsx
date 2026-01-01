import React from 'react';
import { MOCK_COMMUNITIES } from '../../../config/constants';

export const CommunitiesView: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Sub-Communities</h2>
      <p className="text-gray-600">Join specialized groups to collaborate on niche topics.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {MOCK_COMMUNITIES.map(c => (
        <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
              {c.isPrivate && <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Private</span>}
            </div>
            <p className="text-gray-500 text-sm mb-4">{c.description}</p>
            <span className="text-sm text-gray-400">{c.memberCount} members</span>
          </div>
          <button className="px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-lg text-sm hover:bg-brand-100">
            {c.isPrivate ? 'Request' : 'Join'}
          </button>
        </div>
      ))}
    </div>
  </div>
);