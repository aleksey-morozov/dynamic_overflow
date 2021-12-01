import _ from 'lodash';

const BLOCK_SIZE = 20;
let blocks = [];
let fruElements = [];

window.addEventListener('load', () => {
  start();
});

function start() {
  init();
  fruElements = getFruElements();
  for (const fruElement of fruElements) {
    moveElementToNewPosition(fruElement);
  }
}

function moveElementToNewPosition(fruElement) {
  const enemies = getEnemies(fruElement);
  if (!enemies.length) {
    // нет конфликтов, остаемся где находимся
    return false;
  }

  const fruElementRect = fruElement.getBoundingClientRect();
  let next = { x: fruElementRect.x, y: fruElementRect.y - (fruElementRect.height + BLOCK_SIZE) };

  const initialY = fruElementRect.y;
  // const initialX = fruElementRect.x;

  for (let tryCounter = 0; tryCounter < 5; tryCounter++) {
    // определяем есть ли на следующей позиции кто-нибудь
    const targetBlocks = getBlocksByCoordinates({ height: fruElementRect.height, width: fruElementRect.width, ...next });

    const targetHasFruElement = targetBlocks.some(block => block.elements.length && _.intersection(block.elements, fruElements).length);
    if (targetHasFruElement) {
      // пересечение с нашим элементом, решить что делать
    }

    // смотрим нет ли вражеских элементов в следующих блоках
    const occupied = targetBlocks.some(block => block.elements.length && !block.elements.includes(fruElement));
    if (!occupied) {
      // свободно! можно двигать наш элемент
      fruElement.style.inset = next.y + 'px auto auto ' + next.x + 'px';
      // определяем новые позиции
      reInit();
      break;
    }

    // занято! пытаемся найти следующую позицию выше
    const enemy = getEnemyPositions(targetBlocks);
    next.y = enemy.y - (fruElementRect.height + BLOCK_SIZE);

    if (next.y < 0) {
      // ой, мы вышли за границу экрана
      // ищем блоки занимаемые врагами в самом низу и отступаем в лево от них
      const bottomBlocks = getBlocksByCoordinates({ height: fruElementRect.height, width: fruElementRect.width, y: initialY, x: next.x });
      // x врага
      const { x: enemyX } = getEnemyPositions(bottomBlocks);

      next = {
        // двигаем влево от врага на ширину нашего элемента
        x: enemyX - (fruElementRect.width + BLOCK_SIZE),
        y: initialY
      };
    }
  }
}

function getBlocksByCoordinates(coordinates) {
  // выбираем все блоки которые займет элемент
  return blocks.filter(block => getCollision(block.x, block.y, coordinates.x, coordinates.y, coordinates.height, coordinates.width));
}

function getEnemyPositions(filledBlocks) {
  const enemyElements = _.uniq(_.flatten(filledBlocks.map(block => block.elements)));

  const yPositions = [];
  const xPositions = [];

  enemyElements.forEach(enemyElement => {
    const allBlocks = blocks.filter(brick => brick.elements.includes(enemyElement));

    const posY = _.uniq(allBlocks.map(block => block.y));
    const posX = _.uniq(allBlocks.map(block => block.x));

    yPositions.push(_.min(posY));
    xPositions.push(_.min(posX));
  });

  const x = _.min(xPositions);
  const y = _.min(yPositions);

  return { x, y };
}

function setElementsInitialPositions() {
  const elements = findElements();

  blocks.forEach(block => {
    elements.forEach(element => {
      const iframeRect = element.getBoundingClientRect();
      const isIntersected = getCollision(block.x, block.y, iframeRect.x, iframeRect.y, iframeRect.height, iframeRect.width);
      if (isIntersected) {
        block.elements.push(element);
      }
    });
  });
}

function reInit() {
  blocks = blocks.map(block => ({ x: block.x, y: block.y, elements: [] }));
  setElementsInitialPositions();
}

function init() {
  setBlocks();
  setElementsInitialPositions();
}

function setBlocks() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const area = width * height;

  const blockSize = Math.pow(BLOCK_SIZE, 2);
  const blocksCount = Math.round(area / blockSize);

  let x = 0;
  let y = 0;

  blocks = [];

  for (let count = 0; count < blocksCount; count++) {
    const dot = { x, y, elements: [] };
    blocks.push(dot);

    x += BLOCK_SIZE;

    if (x >= width) {
      x = 0;
      y += BLOCK_SIZE;
    }
  }
}

function getCollision(dotX, dotY, iframeX, iframeY, height, width) {
  const DOT_SIZE = 10;

  if (
    dotX < iframeX + width &&
    dotX + DOT_SIZE > iframeX &&
    dotY < iframeY + height &&
    DOT_SIZE + dotY > iframeY
  ) {
    return true;
  }

  return false;
}

function findElements() {
  return [...document.querySelectorAll('*')]
    .filter(element => {
        const isPosition = ["static", "relative"].indexOf(element.computedStyleMap().get('position').value) === -1;
        const isDisplay = element.computedStyleMap().get('display').value !== 'none';
        const isHeight = element.computedStyleMap().get('height').value > 0;

        const rect = element.getBoundingClientRect();
        const isVisiblePosition = rect.top > 0 && rect.left > 0;

        return isPosition && isDisplay && isHeight && isVisiblePosition;
      }
    );
}

function getEnemies(fruElement) {
  const intersectedBlocks = blocks.filter(block => block.elements.includes(fruElement) && block.elements.length > 1);
  if (intersectedBlocks.length) {
    const all = intersectedBlocks.map(block => block.elements);
    const flat = _.flatten(all);
    return _.uniq(flat).filter(el => el !== fruElement);
  }

  return [];
}

function getFruElements() {
  return document.querySelectorAll('.fruElement');
}
