import React, { useEffect, useRef, useState } from "react";
import CatSprite from "./CatSprite";
import { Trash2 } from "lucide-react";
import { createAvatar } from "../utils/util";
import { Play, Stop } from "lucide-react";



export default function PreviewArea({ avatarInstances, setAvatarInstances, selectedInstance, setSelectedInstance, play, handlePlay }) {

  const previewAreaRef = useRef(null);
  const draggingInfo = useRef({
    isDragging: false,
    id: null,
    offsetX: 0,
    offsetY: 0,
  });

  const handleAddAvatar = () => {
    const newAvatar = createAvatar();
    setAvatarInstances((prev) => [...prev, newAvatar]);
    setSelectedInstance(newAvatar);
  };



  // event wil happen when button is pressed
  const handleMouseDown = (e, avatarId) => {
    const avatarEl = document.getElementById(avatarId);
    if (avatarEl) {
      const rect = avatarEl.getBoundingClientRect();
      draggingInfo.current = {
        isDragging: true,
        id: avatarId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
    }
  };

  // while mouse is moving
  const handleMouseMove = (e) => {
    if (!draggingInfo.current.isDragging || !previewAreaRef.current) return;

    const { id, offsetX, offsetY } = draggingInfo.current;
    const containerRect = previewAreaRef.current.getBoundingClientRect();

    let newX = ((e.clientX - containerRect.left - offsetX) / containerRect.width) * 100;
    let newY = ((e.clientY - containerRect.top - offsetY) / containerRect.height) * 100;

    newX = Math.min(Math.max(newX, 0), 100);
    newY = Math.min(Math.max(newY, 0), 100);

    setAvatarInstances((prev) =>
      prev.map((avatar) =>
        avatar.id === id
          ? { ...avatar, position: { x: newX, y: newY } }
          : avatar
      )
    );
  };

  // when mouse is released
  const handleMouseUp = () => {
    draggingInfo.current.isDragging = false;
    draggingInfo.current.id = null;
  };

  const handleDeleteAvatar = (e, avatar) => {
    e.stopPropagation();
    setAvatarInstances((prev) => prev.filter((a) => a.id !== avatar.id));
    if (selectedInstance?.id === avatar.id) {
      setSelectedInstance(null);
    }

  }
  const handleCoordinateChange = (positionDirection, value) => {
    if (!selectedInstance)
      return;
    const clampedValue = Math.max(0, Math.min(100, Number(value)));
    setAvatarInstances((prev) => prev.map((a) => (a.id === selectedInstance?.id ? {
      ...a, position: { ...a.position, [positionDirection]: clampedValue }
    } : a)));
    setSelectedInstance(prev => ({ ...prev, position: { ...prev.positon, [positionDirection]: clampedValue } }))
  }

  const handleInputConstraint = (e) => {
    const val = Number(e.target.value);
    if (val > 100) e.target.value = 100;
    if (val < 0) e.target.value = 0;
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);



  return (
    <div className="flex flex-col space-y-4 h-full p-4 bg-gray-50">
      <div
        ref={previewAreaRef}
        className="h-1/2 bg-white border border-gray-200 rounded relative select-none overflow-hidden"
      >
        {avatarInstances.map((avatar) => (
          <div
            key={avatar.id}
            id={avatar.id}
            className={`absolute cursor-grab ${avatar?.id === selectedInstance?.id ? "ring-2 ring-purple-500" : ""
              }`}
            style={{
              left: `${avatar?.position?.x}%`,
              top: `${avatar?.position?.y}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, avatar.id)}
            onClick={() => setSelectedInstance(avatar)}
          >
            <CatSprite />
          </div>
        ))}
      </div>

      <div className="p-4 h-2/5 bg-white border border-gray-200 rounded overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleAddAvatar}
              className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Avatar
            </button>
            <button disabled={play} onClick={() => handlePlay(true)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs">
              Play
            </button>
            <button disabled={!play} onClick={() => handlePlay(false)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs">
              Stop
            </button>
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <label className="mr-2 text-sm">X:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={selectedInstance?.position?.x}
                onChange={(e) => handleCoordinateChange('x', e.target.value)}
                className="w-12 px-2 py-1 border border-gray-300 rounded"
              />
              <span className="ml-1 text-sm text-gray-500">%</span>
            </div>
            <div className="flex items-center">
              <label className="mr-2 text-sm">Y:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={selectedInstance?.position?.y}
                onChange={(e) => handleCoordinateChange('y', e.target.value)}
                className="w-12 px-2 py-1 border border-gray-300 rounded"
              />
              <span className="ml-1 text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap mt-4 space-x-4">
          {avatarInstances.map((avatar, index) => (
            <div
              key={avatar.id}
              className={`flex flex-col items-center p-4 rounded-lg border shadow-sm cursor-pointer relative transition-all duration-200 ${selectedInstance?.id === avatar.id
                ? "border-purple-500 bg-white shadow-md ring-1 ring-purple-300"
                : "border-gray-200 bg-gray-50 hover:shadow"
                }`}
              onClick={() => setSelectedInstance(avatar)}
            >
              <button
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-red-200 text-red-600 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:scale-105 transition-all duration-200"
                onClick={(e) => handleDeleteAvatar(e, avatar)}
                title="Delete Avatar"
              >
                <Trash2 color="currentColor" size={14} />
              </button>
              <CatSprite width={35} height={35} />
              <span className="text-xs mt-2 text-gray-700 font-medium">Sprite {index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
