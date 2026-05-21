import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Disconnect socket if user is not authenticated
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketInstance = io(
      import.meta.env.VITE_NOTIFICATION_SERVICE_URL ||
        'https://notification-service-c83g.onrender.com',
      {
        withCredentials: true,
        auth: {
          token: localStorage.getItem('token')
        }
      }
    );

    // Socket connected
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);

      // Join user role room
      if (user && user.role) {
        socketInstance.emit('joinUserRole', user.role);
      }
    });

    // Socket disconnected
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Socket error
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Save socket instance
    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Join event room
  const joinEventRoom = (eventId) => {
    if (socket && connected && eventId) {
      socket.emit('joinEvent', eventId);
    }
  };

  // Leave event room
  const leaveEventRoom = (eventId) => {
    if (socket && connected && eventId) {
      socket.emit('leaveEvent', eventId);
    }
  };

  const value = {
    socket,
    connected,
    joinEventRoom,
    leaveEventRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;