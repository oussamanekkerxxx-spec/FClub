import Canvas from '../components/board/Canvas';

export default function Board() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
      <Canvas />
    </div>
  );
}
