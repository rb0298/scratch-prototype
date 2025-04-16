import React, { useRef, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import { createAvatar } from "./utils/util";
import { ScratchMultiSpriteEngine } from "./utils/spiritPlayLogic";




export default function App() {
  const [avatarInstances, setAvatarInstances] = useState(() => {
    const avatar = createAvatar();
    return [avatar];
  });

  const [play, setPlay] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(avatarInstances?.[0] || null);
  const selectedAvatarIndex = avatarInstances.findIndex(avatar => avatar.id === selectedInstance?.id);


  const engineRef = useRef(null);
  const handleUpdateBlock = (avatarId, newBlocks) => {
    setAvatarInstances((prevAvatars) =>
      prevAvatars.map((avatar) =>
        avatar.id === avatarId
          ? { ...avatar, blocks: newBlocks }
          : avatar
      )
    );
    setSelectedInstance(prevAvatar => ({ ...prevAvatar, blocks: newBlocks }));
  };

  const handlePlay = (newplay) => {
    setPlay(newplay);
  }

  useEffect(() => {
    if (!selectedInstance) return;

    // Initialize engine only once
    if (!engineRef.current) {
      engineRef.current = new ScratchMultiSpriteEngine();
    }

    // Get current sprite IDs from engine
    const currentSpriteIds = engineRef.current.sprites
      ? Array.from(engineRef.current.sprites.keys())
      : [];

    // Process all avatars
    avatarInstances.forEach(avatar => {
      const { id, position: { x, y }, blocks } = avatar;
      const element = document.getElementById(id);

      if (!currentSpriteIds.includes(id)) {
        // Register new avatar
        engineRef.current.registerSprite(id, element, { x, y }, blocks);
      } else {
        // Update existing avatar position
        const sprite = engineRef.current.sprites.get(id);
        if (sprite) {
          sprite.state.x = x;
          sprite.state.y = y;
          sprite.blocks = blocks;
          engineRef.current.updateVisuals(id);
        }
      }
    });

    // Cleanup removed avatars
    currentSpriteIds.forEach(id => {
      if (!avatarInstances.some(avatar => avatar.id === id)) {
        engineRef.current.unregisterSprite(id);
      }
    });

    async function play() {
      if (play) {

        await engineRef.current.playAll();
        setPlay(false);
        setAvatarInstances(avatarInstances.map(prevAvatar => {
          const { id } = prevAvatar;
          console.log(engineRef.current.sprites.get(id).state)
          const { x, y } = engineRef.current.sprites.get(id).state
          return { ...prevAvatar, position: { x, y } };
        }))
        setSelectedInstance(prevInstance => {
          const { x, y } = engineRef.current.sprites.get(prevInstance.id).state
          return { ...prevInstance, position: { x, y } };
        })
      } else {
        engineRef.current.stopAll();
      }

    }
    play();

  }, [play]);

  return (
    <div className="bg-blue-100 pt-6 font-sans">
      <div className="h-screen overflow-hidden flex flex-row">
        <div className="flex-1 h-screen overflow-hidden flex flex-row bg-white border-t border-r border-gray-200 rounded-tr-xl mr-2">
          <Sidebar /> <MidArea selectedInstance={selectedInstance} handleUpdateBlock={handleUpdateBlock} avatarIndex={selectedAvatarIndex + 1} />
        </div>
        <div className="w-1/3 h-screen overflow-hidden  bg-white border-t border-l border-gray-200 rounded-tl-xl ml-2">
          <PreviewArea handlePlay={handlePlay} play={play} avatarInstances={avatarInstances} selectedInstance={selectedInstance} setAvatarInstances={setAvatarInstances} setSelectedInstance={setSelectedInstance} />
        </div>
      </div>
    </div>
  );
}
