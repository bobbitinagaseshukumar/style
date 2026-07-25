import React, { useEffect, useState } from 'react';
import api from '../../config/api';

const CMSPage = ({ slug, title }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        // Assuming API returns { page: { title, content } }
        const { data } = await api.get(`/settings/cms/${slug}`);
        setContent(data.page?.content || 'Content coming soon.');
      } catch (error) {
        setContent('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return <div className="py-20 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-playfair font-bold text-charcoal-900 mb-8 text-center">{title}</h1>
      <div 
        className="prose prose-lg max-w-none text-gray-700 prose-headings:font-playfair prose-headings:text-charcoal-900 prose-a:text-gold-600 hover:prose-a:text-gold-500"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
};

export default CMSPage;
