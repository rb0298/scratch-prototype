import React, { useState, useRef } from 'react';
import Icon from './Icon';
import { Trash2 } from 'lucide-react';

// Block component for the MidArea


const Block = ({ block, onValueChange, onDragStart, onDragEnd, onDragOver, onDelete }) => {
  const { id, template, className, value, name } = block;
  const handleInputChange = (blockId, inputName, inputType, newValue) => {
    let processedValue = newValue;

    // Process value based on input type
    if (inputType === 'number') {
      processedValue = newValue === '' ? '' : Number(newValue);
    }
    const finalValue = block.name === inputName ? { [block.name]: processedValue } : {
      [block.name]: {
        ...block?.value?.[block.name],
        [inputName]: processedValue
      }
    }
    onValueChange(blockId, finalValue);
  };


  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`${className} w-3/5 text-white p-3 mb-3 rounded flex items-center shadow-md cursor-grab relative`}
      data-id={id} >
      <button
        className="absolute -top-2 -right-2 w-8 h-8 bg-white border cursor-pointer border-red-200 text-red-600 rounded-full flex items-center justify-center  hover:bg-red-50 hover:scale-105 transition-all duration-200"
        onClick={() => onDelete(block.id)}
        title="Delete Block"
      >
        <Trash2 color="currentColor" size={18} />
      </button>
      <div className="flex-1 flex items-center flex-wrap">
        {template.map((item, index) => {
          if (typeof item === 'string') {
            return <span key={index} className="mr-1">{item}</span>;
          }

          if (item.type === 'input') {
            return (
              <input
                key={index}
                type={item.inputType || 'text'}
                value={(item.name === name ? value[name] : value?.[name]?.[item.name]) ?? ''}
                className={`bg-white/20 border border-white/30 rounded px-1 text-black ${item.className || ''}`}
                onChange={(e) => handleInputChange(id, item.name, item.inputType, e.target.value)}
              />
            );
          }

          if (item.type === 'icon') {
            return <Icon key={index} name={item.name} size={item.size} className={item.className || ''} />;
          }
          return null;
        })}
      </div>
    </div>
  );
};

// Middle area where blocks are arranged
const MidArea = ({ selectedInstance, handleUpdateBlock, avatarIndex }) => {
  const { id: avatarId, blocks } = selectedInstance || { blocks: [], avatarId: null };
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);
  const midAreaRef = useRef(null);


  // Handle input value change for blocks
  const handleValueChange = (blockId, value) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId
        ? {
          ...block,
          value
        }
        : block
    );
    handleUpdateBlock(avatarId, updatedBlocks);// Update the block in the instance
  };

  // Handle drag start from an existing block in mid area
  const handleBlockDragStart = (e, block) => {
    setDraggedBlock(block);
    e.dataTransfer.setData('application/json', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'move';

    // Add a class to the dragged element
    const element = e.target;
    setTimeout(() => {
      element.classList.add('opacity-50');
    }, 0);
  };

  const handleBlockDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedOverId(null);
  };

  const handleBlockDragOver = (e, id) => {
    e.preventDefault();
    if (draggedOverId !== id) {
      setDraggedOverId(id);
    }
  };

  // Handle drop on the mid area
  const handleDrop = (e) => {
    e.preventDefault();
    if (!avatarId)
      return;
    const data = e.dataTransfer.getData('application/json');

    if (!data) return;

    const droppedBlock = JSON.parse(data);


    // If we're reordering within the mid area
    if (draggedBlock && droppedBlock.id === draggedBlock.id && draggedOverId) {
      const blocksCopy = [...blocks];
      const draggedIndex = blocksCopy.findIndex(b => b.id === draggedBlock.id);
      const dropIndex = blocksCopy.findIndex(b => b.id === draggedOverId);

      if (draggedIndex !== -1 && dropIndex !== -1) {
        // Remove the dragged item
        const [removed] = blocksCopy.splice(draggedIndex, 1);
        // Insert it at the new position
        blocksCopy.splice(dropIndex, 0, removed);
        handleUpdateBlock(avatarId, blocksCopy);
      }
    }
    // If we're dropping from the sidebar
    else if (e.target === midAreaRef.current || midAreaRef.current.contains(e.target)) {
      // Check if it's not already in the list (new from sidebar)
      if (!blocks.some(b => b.id === droppedBlock.id)) {
        handleUpdateBlock(avatarId, [...blocks, droppedBlock]);
      }
    }

    setDraggedBlock(null);
    setDraggedOverId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedBlock ? 'move' : 'copy';
  };

  // Handle deletion of blocks
  const handleDeleteBlock = (blockId) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    handleUpdateBlock(avatarId, newBlocks);
  };

  return (
    <div
      className="flex-1 p-4 overflow-y-auto"
      ref={midAreaRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h2 className="text-lg font-bold mb-4">Script</h2>
      {blocks.map((block) => (
        <Block
          key={block.id}
          block={block}
          onValueChange={handleValueChange}
          onDragStart={(e) => handleBlockDragStart(e, block)}
          onDragEnd={handleBlockDragEnd}
          onDragOver={(e) => handleBlockDragOver(e, block.id)}
          onDelete={() => handleDeleteBlock(block.id)}
        />
      ))}
      {blocks.length === 0 && (
        <div className="text-gray-500 text-center p-8 border-2 border-dashed rounded">
          Drag blocks here to create your workflow
        </div>
      )}
    </div>
  );
};

export default MidArea;