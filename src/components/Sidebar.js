import React, { useState, useCallback } from "react";
import Icon from "./Icon";


const blocks = {
  motion: [,
    {
      id: 'steps',
      template: ['Move', { type: 'input', name: "steps", inputType: 'number', className: 'w-12 mx-1' }, 'steps'],
      className: "bg-blue-500",
    },
    {
      id: 'degrees',
      template: [
        'Turn',
        { type: 'icon', name: 'redo', size: 15, className: 'mx-1' },
        { type: 'input', name: "degrees", inputType: 'number', className: 'w-12 mx-1' },
        'degrees'
      ],
      className: "bg-blue-500",
    },
    {
      id: 'coords',
      template: [
        'Go to x:',
        { type: 'input', name: 'x', inputType: 'number', className: 'w-12 mx-1' },
        'y:',
        { type: 'input', name: 'y', inputType: 'number', className: 'w-12 mx-1' }
      ],
      className: "bg-blue-500",
    }
  ],
  looks: [
    {
      id: 'say',
      template: [
        'Say',
        { type: 'input', name: 'text', inputType: 'string', className: 'w-20 mx-1' },
        'for',
        { type: 'input', name: 'sec', inputType: 'number', className: 'w-12 mx-1' },
        'seconds'
      ],
      className: "bg-purple-500",
    },
    {
      id: 'think',
      template: [
        'Think',
        { type: 'input', name: 'text', inputType: 'string', className: 'w-20 mx-1' },
        'for',
        { type: 'input', name: 'sec', inputType: 'number', className: 'w-12 mx-1' },
        'seconds'
      ],
      className: "bg-purple-500",
    }
  ],
  control: [
    {
      id: 'repeat',
      template: [
        'Repeat',
        { type: 'input', name: 'repeat', inputType: 'number', className: 'w-12 mx-1' },
      ],
      className: 'bg-yellow-500',
    }
  ]

}

const Block = ({ template, className = '', onInputChange, value, id, ...props }) => {
  return (
    <div className={`flex flex-row flex-wrap items-center text-white px-3 py-2 my-1 text-sm cursor-pointer rounded ${className}`} {...props}>
      {template.map((item, index) => {
        if (typeof item === 'string') {
          return <span key={index}>{item}</span>;
        }

        if (item.type === 'input') {
          return (
            <input
              key={index}
              type={item.inputType}
              value={item.name === id ? value : value?.[item.name]}
              className={`bg-white/20 border border-white/30 rounded px-1 text-black ${item.className}`}
              onChange={(e) => onInputChange(id, item.name, item.inputType, e.target.value)}
            />
          );
        }

        if (item.type === 'icon') {
          return <Icon key={index} name={item.name} size={item.size} className={item.className} />;
        }

        return null;
      })}
    </div>
  );
};

const Sidebar = () => {

  const [input, setInput] = useState({
    steps: 10,
    degrees: 15,
    coords: { x: 0, y: 0 },
    say: { text: '', sec: 0 },
    think: { text: '', sec: 0 },
    repeat: 10,
  })

  const handleDragStart = (e, block) => {
    // Create a copy of the block for the mid area
    const newBlock = {
      ...block,
      id: `${block.id}-${Date.now()}`,
      value: { [block.id]: input[block.id] },
      name: block.id,
    };
    // stores the newBlock data in the drag event so it can be accessed later in the onDrop event.
    e.dataTransfer.setData('application/json', JSON.stringify(newBlock));
    // visually tells the user that the dragged item will be copied not moved 
    e.dataTransfer.effectAllowed = 'copy';
  };


  const handleInputChange = useCallback((id, name, inputType, value) => {

    const updatedValue = inputType === 'number' ? parseInt(value, 10) : value;

    setInput(prevState => {
      const safeValue = Number.isNaN(updatedValue) ? '' : updatedValue;
      if (name === id) {
        return { ...prevState, [id]: safeValue };
      } else {
        return {
          ...prevState,
          [id]: {
            ...prevState?.[id],
            [name]: safeValue,
          },
        };
      }
    });
  }, []);



  return (
    <div className="w-70 flex-none overflow-y-auto flex flex-col items-start p-4 border-r border-gray-200">
      {/* Motion Section */}
      <h2 className="font-bold text-sm mb-2 mt-4">Motion</h2>
      {blocks.motion.map(block => (
        <Block
          key={block.id}
          id={block.id}
          template={block.template}
          className={block.className}
          onInputChange={handleInputChange}
          value={input?.[block.id] || ''}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, block)}
        />
      ))}

      {/* Looks Section */}
      <h2 className="font-bold text-sm mb-2 mt-6">Looks</h2>
      {blocks.looks.map(block => (
        <Block
          key={block.id}
          id={block.id}
          template={block.template}
          className={block.className}
          onInputChange={handleInputChange}
          value={input?.[block.id] || ''}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, block)}
        />
      ))}

      {/* Control Section */}
      <h2 className="font-bold text-sm mb-2 mt-6">Control</h2>
      {blocks.control.map(block => (
        <Block
          key={block.id}
          id={block.id}
          template={block.template}
          className={block.className}
          value={input?.[block.id] || ''}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, block)}
          onInputChange={handleInputChange}
        />
      ))}
    </div>
  );
}

export default Sidebar;
