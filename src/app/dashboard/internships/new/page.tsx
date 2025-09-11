'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NewInternshipPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    locationType: 'onsite',
    duration: 12,
    stipend: '',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available companies for this actor (admin will receive only their company)
    (async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data?.success) {
          const list = (data.data?.companies || []).map((c: any) => ({ id: c.id, name: c.name }));
          setCompanies(list);
          if (list.length > 0) setCompanyId(list[0].id);
        }
      } catch {}
    })();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'duration' ? Number(value) : value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (!companyId) throw new Error('Select a company');
      const payload = {
        title: form.title,
        description: form.description,
        companyId,
        location: form.location,
        locationType: form.locationType,
        duration: form.duration,
        stipend: form.stipend ? Number(form.stipend) : null,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        responsibilities: [],
        qualifications: [],
      };
      const resp = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Failed to create internship');
      setSuccess('Internship created successfully');
      
      // Redirect to dashboard after successful creation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create internship');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Internship</h1>
        {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{error}</div>}
        {success && <div className="mb-4 p-3 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Company</label>
            <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 rounded border dark:bg-gray-700">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <input required name="title" value={form.title} onChange={onChange} placeholder="Title" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <textarea required name="description" value={form.description} onChange={onChange} placeholder="Description" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input required name="location" value={form.location} onChange={onChange} placeholder="Location" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <select name="locationType" value={form.locationType} onChange={onChange} className="w-full px-3 py-2 rounded border dark:bg-gray-700">
            <option value="onsite">Onsite</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <input type="number" name="duration" value={form.duration} onChange={onChange} placeholder="Duration (weeks)" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input type="number" name="stipend" value={form.stipend} onChange={onChange} placeholder="Stipend (optional)" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <input name="skills" value={form.skills} onChange={onChange} placeholder="Skills (comma separated)" className="w-full px-3 py-2 rounded border dark:bg-gray-700" />
          <button disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg">{submitting ? 'Submitting...' : 'Create'}</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}


