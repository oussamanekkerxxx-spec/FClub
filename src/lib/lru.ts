// ── Simple LRU Cache ──
// No external dependency. O(1) get/set via Map + doubly-linked list.

interface LruNode<K, V> {
  key: K;
  value: V;
  prev: LruNode<K, V> | null;
  next: LruNode<K, V> | null;
}

export class LruCache<K, V> {
  private map = new Map<K, LruNode<K, V>>();
  private head: LruNode<K, V> | null = null;
  private tail: LruNode<K, V> | null = null;

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    const node: LruNode<K, V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.addToFront(node);

    if (this.map.size > this.capacity) {
      this.evictLRU();
    }
  }

  private moveToFront(node: LruNode<K, V>): void {
    if (node === this.head) return;
    this.detach(node);
    this.addToFront(node);
  }

  private addToFront(node: LruNode<K, V>): void {
    node.next = this.head;
    node.prev = null;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private detach(node: LruNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
  }

  private evictLRU(): void {
    if (!this.tail) return;
    this.map.delete(this.tail.key);
    this.detach(this.tail);
  }
}
