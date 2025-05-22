"use client";

import React, { useRef, useState, useEffect } from 'react';
import { TimelineCard } from './TimelineCard';
import { PostDetailModal } from './PostDetailModal';
import { format, parseISO } from 'date-fns'; // parseISO is used

// Assuming ClientPost type is similar to what's defined in page.tsx
type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  tags?: string[];
  categories?: string[];
  creator?: {
    id: string;
    username: string;
  };
};

type TimelineProps = {
  posts: Post[];
  onEditRequest: (post: Post) => void; // For editing
  onDeleteRequest: (postId: string) => void; // For deleting
};

export function TimelineContainer({ posts, onEditRequest, onDeleteRequest }: TimelineProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dotPositions, setDotPositions] = useState<number[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPost(null), 300); 
  };
  
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, posts.length); // Ensure refs array matches posts length
    const calculateDotPositions = () => {
      const positions = cardRefs.current
        .filter(ref => ref !== null)
        .map(ref => {
          const top = ref!.offsetTop;
          const height = ref!.offsetHeight;
          return (top + height) - 64 * 2; 
        });
      setDotPositions(positions);
    };
    
    const timer = setTimeout(calculateDotPositions, 100);
    window.addEventListener('resize', calculateDotPositions);
    
    const observers = cardRefs.current.map((ref) => {
      if (!ref) return null;
      const observer = new MutationObserver(calculateDotPositions);
      observer.observe(ref, { childList: true, subtree: true, attributes: true, characterData: true });
      return observer;
    });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateDotPositions);
      observers.forEach(obs => obs?.disconnect());
    };
  }, [posts]); // Rerun if posts array itself changes (e.g. length)

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const formattedDate = format(date, "dd/MM");
      const formattedTime = format(date, "yyyy/HH:mm");
      return { date: formattedDate, time: formattedTime };
    } catch (e) {
      return { date: "Недоступно", time: "--:--" };
    }
  };
  
  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-32"> 
        <div className="flex">
          <div className="relative w-24 flex-shrink-0 hidden md:block"> 
            <div className="absolute h-full w-[2px] bg-gray-200 dark:bg-gray-700 left-1/2 -translate-x-1/2">
              {/* ... dot rendering logic ... */}
              <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '0px' }}>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -translate-y-1/2 z-10" />
              </div>
              {posts.map((post, index) => {
                const topPosition = dotPositions[index] || (index * 200 + 70);
                const { date, time } = formatDateTime(post.createdAt);
                return (
                  <div key={`${post.id}-dot`} className="absolute left-1/2 -translate-x-1/2" style={{ top: `${topPosition}px` }}>
                    <div className="absolute right-6 -translate-y-1/2 text-right whitespace-nowrap">
                      <div className="text-3xl md:text-4xl font-normal text-gray-400 dark:text-gray-500">{date}</div>
                      <div className="text-base md:text-lg text-gray-400 dark:text-gray-500">{time}</div>
                    </div>
                    <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -translate-y-1/2 z-10" />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex-grow md:pl-8 max-w-[40rem]">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                className="mb-16 relative"
                ref={el => { cardRefs.current[index] = el; }}
              >
                <TimelineCard
                  post={post}
                  onClick={handleCardClick}
                  onEditRequest={onEditRequest} // Pass down
                  onDeleteRequest={onDeleteRequest} // Pass down
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <PostDetailModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEditRequest={onEditRequest} // Pass down
        onDeleteRequest={onDeleteRequest} // Pass down
      />
    </>
  );
}