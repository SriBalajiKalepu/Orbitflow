import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Orbit, Home } from 'lucide-react';
import { Button } from '@/components/ui/Modal';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md p-8"
    >
      <div className="text-8xl font-black text-gradient mb-4">404</div>
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-float">
        <Orbit className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-3">Page not found</h1>
      <p className="text-[hsl(var(--muted-foreground))] mb-8">
        This page seems to have drifted into another orbit. Let's get you back on track.
      </p>
      <Link to="/dashboard">
        <Button icon={<Home className="w-4 h-4" />} size="lg">
          Back to Dashboard
        </Button>
      </Link>
    </motion.div>
  </div>
);
