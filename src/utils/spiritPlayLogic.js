export class ScratchMultiSpriteEngine {
    constructor() {
        this.sprites = new Map();
        this.isRunning = false;
        this.collisionThreshold = 10; // Percentage distance for collision
        this.animationQueue = [];
    }

    registerSprite(spriteId, element, initialPos = { x: 50, y: 50 }, blocks = []) {
        const state = {
            x: Math.min(Math.max(initialPos.x, 0), 100),
            y: Math.min(Math.max(initialPos.y, 0), 100),
            rotation: 0,
            message: null,
            messageTimeout: null,
            isAnimating: false,
            direction: 1,
            originalBlocks: [...blocks],
            id: spriteId
        };

        const executor = {
            run: async (blocks) => {
                let i = 0;
                while (i < blocks.length && this.isRunning) {
                    const block = blocks[i];
                    if (block.name === 'repeat') {
                        const times = block.value.repeat;
                        const startIdx = i + 1;
                        state.isAnimating = true;

                        for (let count = 0; count < times && this.isRunning; count++) {
                            let j = startIdx;
                            while (j < blocks.length && this.isRunning) {
                                if (blocks[j].name !== 'repeat') {
                                    await this.executeCommand(spriteId, blocks[j]);
                                    if (state.isAnimating) {
                                        await new Promise(resolve => setTimeout(resolve, 300));
                                        // await new Promise(resolve => requestAnimationFrame(resolve));
                                        this.processCollisionQueue();
                                    }
                                }
                                j++;
                            }
                        }
                        state.isAnimating = false;
                        return;
                    } else {
                        await this.executeCommand(spriteId, block);
                        i++;
                    }
                }
            },
        };

        this.sprites.set(spriteId, { element, state, executor, blocks });
        this.updateVisuals(spriteId);
    }

    checkAllCollisions() {
        const sprites = Array.from(this.sprites.values());
        for (let i = 0; i < sprites.length; i++) {
            for (let j = i + 1; j < sprites.length; j++) {
                if (this.checkCollision(sprites[i], sprites[j])) {
                    this.handleCollision(sprites[i], sprites[j]);
                }
            }
        }
    }

    processCollisionQueue() {
        while (this.animationQueue.length > 0) {
            const spriteId = this.animationQueue.shift();
            this.checkCollisionsForSprite(spriteId);
        }
    }

    checkCollision(sprite1, sprite2) {
        const dx = sprite1.state.x - sprite2.state.x;
        const dy = sprite1.state.y - sprite2.state.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.collisionThreshold;
    }

    handleCollision(sprite1, sprite2) {
        // Reverse directions
        sprite1.state.direction *= -1;
        sprite2.state.direction *= -1;

        // Visual feedback
        const flash = (element) => {
            element.style.transition = 'box-shadow 0.3s';
            element.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.7)';
            setTimeout(() => {
                element.style.boxShadow = '';
                element.style.transition = '';
            }, 300);
        };

        flash(sprite1.element);
        flash(sprite2.element);
    }

    async executeCommand(spriteId, block) {
        if (!this.isRunning) return;
        const sprite = this.sprites.get(spriteId);
        if (!sprite) return;

        const { state } = sprite;
        const { name, value } = block;

        switch (name) {
            case 'coords':
                state.x = Math.min(Math.max(value.coords.x, 0), 100);
                state.y = Math.min(Math.max(value.coords.y, 0), 100);
                break;

            case 'steps':
                const rad = (state.rotation * Math.PI) / 180;
                const steps = value.steps * state.direction;
                const newX = state.x + steps * Math.cos(rad);
                const newY = state.y + steps * Math.sin(rad);
                console.log(newX, newY);

                state.x = Math.min(Math.max(newX, 0), 100);
                state.y = Math.min(Math.max(newY, 0), 100);

                if (state.isAnimating) {
                    this.queueCollisionCheck(spriteId);
                } else {
                    this.checkAllCollisions();
                }
                break;

            case 'degrees':
                state.rotation = (state.rotation + value.degrees) % 360;
                break;

            case 'say':
            case 'think':
                if (state.messageTimeout) {
                    clearTimeout(state.messageTimeout);
                    state.message = null;
                }
                const messageData = value[name];
                state.message = messageData.text;

                state.messageTimeout = setTimeout(() => {
                    state.message = null;
                    this.updateVisuals(spriteId);
                }, messageData.sec * 1000);
                this.updateVisuals(spriteId)
                break;

            default:
                console.warn(`Unknown command type: ${name}`);
        }

        this.updateVisuals(spriteId);
    }

    queueCollisionCheck(spriteId) {
        if (!this.animationQueue.includes(spriteId)) {
            this.animationQueue.push(spriteId);
        }
    }

    checkCollisionsForSprite(spriteId) {
        const sprite = this.sprites.get(spriteId);
        if (!sprite) return;

        this.sprites.forEach((otherSprite, otherId) => {
            if (otherId !== spriteId && this.checkCollision(sprite, otherSprite)) {
                this.handleCollision(sprite, otherSprite);
            }
        });
    }

    updateVisuals(spriteId) {
        const sprite = this.sprites.get(spriteId);
        if (!sprite) return;

        const { element, state } = sprite;
        element.style.top = `${state.y}%`;
        element.style.left = `${state.x}%`;
        element.style.transform = `rotate(${state.rotation}deg)`;

        let bubble = element.querySelector('.speech-bubble');
        if (state.message) {
            if (!bubble) {
                bubble = document.createElement('p');
                bubble.textContent = state.message;
                bubble.className = 'speech-bubble';
                element.append(bubble);
            }
        } else if (bubble) {
            bubble.remove();
        }
    }

    unregisterSprite(id) {
        this.sprites.delete(id);
    }

    async playAll() {
        if (this.isRunning) return;
        this.isRunning = true;

        await Promise.all(
            Array.from(this.sprites.keys()).map(spriteId => {
                const blocks = this.sprites.get(spriteId)?.blocks || [];
                return this.sprites.get(spriteId).executor.run(blocks);
            })
        );

        this.isRunning = false;
    }

    stopAll() {
        this.isRunning = false;
        this.sprites.forEach(({ state }) => {
            if (state.messageTimeout) {
                clearTimeout(state.messageTimeout);
                state.message = null;
            }
        });
    }
}