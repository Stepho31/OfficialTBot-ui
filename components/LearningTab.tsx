import React, { useState, useCallback, useEffect } from 'react';
import { uploadVideo, getVideos, deleteVideo, Video } from '../lib/api';

type LearningTabProps = {
  jwt?: string;
};

export default function LearningTab({ jwt }: LearningTabProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    description: '',
  });

  const loadVideos = useCallback(async () => {
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const videoList = await getVideos(token);
      setVideos(videoList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!formData.youtubeUrl) {
      setError('Please provide a YouTube URL');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await uploadVideo({
        title: formData.title || 'Untitled Video',
        youtube_url: formData.youtubeUrl,
        description: formData.description || '',
      }, token);
      
      // Reset form
      setFormData({ title: '', youtubeUrl: '', description: '' });
      setShowUploadForm(false);
      
      // Reload videos
      await loadVideos();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) return;

    try {
      await deleteVideo(videoId, token);
      await loadVideos();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete video');
    }
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const getEmbedUrl = (youtubeUrl: string): string => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return youtubeUrl;
  };

  return (
    <div>
      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Trading Education</h2>
        <button 
          className="button" 
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? 'Cancel' : '+ Upload Video'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ 
          border: '1px solid var(--danger)', 
          color: 'var(--danger)', 
          padding: 12,
          marginBottom: 24 
        }}>
          {error}
        </div>
      )}

      {showUploadForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Upload YouTube Video</h3>
          <form onSubmit={handleSubmit}>
            <div className="vstack" style={{ gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                  Video Title *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter video title"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                  YouTube URL *
                </label>
                <input
                  type="url"
                  className="input"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%' }}
                  required
                />
                <p className="subtle" style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  Paste the full YouTube video URL here
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter video description (optional)"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div className="hstack" style={{ gap: 12 }}>
                <button 
                  type="submit" 
                  className="button" 
                  disabled={uploading || !formData.youtubeUrl}
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button 
                  type="button" 
                  className="button-outline"
                  onClick={() => {
                    setShowUploadForm(false);
                    setFormData({ title: '', youtubeUrl: '', description: '' });
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="subtle">Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="subtle">No videos uploaded yet. Click "Upload Video" to add your first trading education video.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {videos.map((video) => (
            <div key={video.id} className="card" style={{ padding: 24 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  {video.title}
                </h3>
                <button
                  className="button-outline"
                  onClick={() => handleDelete(video.id)}
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  Delete
                </button>
              </div>
              
              {video.description && (
                <p className="subtle" style={{ marginBottom: 16 }}>
                  {video.description}
                </p>
              )}

              <div style={{ 
                position: 'relative', 
                paddingBottom: '56.25%', 
                height: 0, 
                overflow: 'hidden',
                borderRadius: 12,
                border: '1px solid var(--border)'
              }}>
                <iframe
                  src={getEmbedUrl(video.youtube_url)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
              </div>

              <div className="subtle" style={{ marginTop: 12, fontSize: '0.85rem' }}>
                Added {new Date(video.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

