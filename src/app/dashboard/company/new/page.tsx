'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NewCompanyPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      // ownerId will be resolved on the server for admins; for superadmin it must be provided explicitly.
      const res = await fetch('/api/user');
      const userData = await res.json();
      if (!userData?.success) throw new Error('Failed to load user');
      const actor = userData.data.user;

      const payload: any = { ...form };
      if (actor.role === 'admin') payload.ownerId = actor.id;

      const resp = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Failed to create company');
      setSuccess('Company registered successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Register Company</h1>
        {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{error}</div>}
        {success && <div className="mb-4 p-3 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <input required name="name" value={form.name} onChange={onChange} placeholder="Company name" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input name="website" value={form.website} onChange={onChange} placeholder="Website" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input name="location" value={form.location} onChange={onChange} placeholder="Location" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input name="industry" value={form.industry} onChange={onChange} placeholder="Industry" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input name="size" value={form.size} onChange={onChange} placeholder="Company size" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <button disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg">{submitting ? 'Submitting...' : 'Register'}</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}


