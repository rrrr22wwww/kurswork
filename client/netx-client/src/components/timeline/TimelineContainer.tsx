"use client";

import React, { useRef, useState, useEffect } from 'react';
import { TimelineCard } from './TimelineCard';
import { format, parseISO } from 'date-fns';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string; // Опциональный URL изображения
  tags?: string[];    // Опциональные теги
};

type TimelineProps = {
  posts: Post[];
};

export function TimelineContainer({ posts }: TimelineProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dotPositions, setDotPositions] = useState<number[]>([]);
  
  // Изменяем расчет позиций для точек
  useEffect(() => {
    const calculateDotPositions = () => {
      const positions = cardRefs.current
        .filter(ref => ref !== null)
        .map(ref => {
          // Точка будет на уровне верха карточки + треть высоты (примерно на уровне заголовка)
          const top = ref!.offsetTop;
          const height = ref!.offsetHeight;

          // className="mb-16 relative" mb16 = 64px (64 * 2) 
          return (top + height) - 64*2 ; // Не более 80px от верха карточки
        });
      
      setDotPositions(positions);
    };
    
    // Первоначальный расчет с таймаутом для надежности
    const timer = setTimeout(() => {
      calculateDotPositions();
    }, 100);
    
    window.addEventListener('resize', calculateDotPositions);
    
    // Добавляем MutationObserver для отслеживания изменений размеров контента
    const observers = cardRefs.current.map((ref, index) => {
      if (!ref) return null;
      
      const observer = new MutationObserver(() => {
        calculateDotPositions();
      });
      
      observer.observe(ref, { 
        childList: true, 
        subtree: true,
        attributes: true,
        characterData: true 
      });
      
      return observer;
    });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateDotPositions);
      observers.forEach(obs => obs?.disconnect());
    };
  }, [posts.length]);

  // Остальной код без изменений
  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const formattedDate = format(date, "dd/MM");
      const formattedTime = format(date, "yyyy/HH:mm");
      
      return { date: formattedDate, time: formattedTime };
    } catch (e) {
      console.error("Ошибка парсинга даты:", e);
      return { date: "Недоступно", time: "--:--" };
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12 px-32">
      <div className="flex">
        {/* Линия с точками и датами */}
        <div className="relative w-24 flex-shrink-0">
          {/* Вертикальная линия */}
          <div className="absolute h-full w-[2px] bg-gray-200 left-16">
            {/* Начальный круг в верхней части линии */}
            <div
              className="absolute left-0.25 -translate-x-1/2"
              style={{ top: '0px' }}
            >
              <div
                className="w-3 h-3 bg-gray-200 rounded-full -translate-y-1/2 z-10"
                style={{ position: 'relative', left: 0 }}
              />
            </div>

            {/* Точки для постов */}
            {posts.map((post, index) => {
              // Используем статичное позиционирование для точек, если координаты не рассчитаны
              const topPosition = dotPositions[index] || (index * 200 + 70);
              const { date, time } = formatDateTime(post.createdAt);
              
              return (
                <div
                  key={post.id}
                  className="absolute left-0.25 -translate-x-1/2"
                  style={{ top: `${topPosition}px` }}
                >
                  {/* Дата слева от точки */}
                  <div className="absolute right-6 -translate-y-1/2 text-right whitespace-nowrap">
                    <div className="text-4xl font-normal text-gray-400 ">{date}</div>
                    <div className="text-lg  text-gray-400">{time}</div>
                  </div>
                  {/* Точка-индикатор */}
                  <div
                    className="w-3 h-3 bg-gray-200 rounded-full -translate-y-1/2 z-10"
                    style={{ position: 'relative', left: 0 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Карточки постов */}
        <div className="flex-grow">
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className="mb-16 relative"
              ref={el => { cardRefs.current[index] = el; }}
            >
              <TimelineCard post={post} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}