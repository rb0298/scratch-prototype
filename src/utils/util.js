export const createAvatar = function () {
    const randomX = Math.random() * 80 + 10;
    const randomY = Math.random() * 80 + 10;

    return {
        id: Date.now().toString(),
        position: { x: randomX, y: randomY },
        blocks: [],
    };
}


