export class cursor<T> {
  lst: T[];
  idx: number;
  constructor(lst: T[]) {
    this.lst = lst;
    this.idx = 0;
  }

  expect(predicate: (t: T) => boolean) {
    if (!predicate(this.lst[this.idx])) {
      throw new Error(`Unexpected value: ${this.lst[this.idx]}`);
    }
  }

  peek(): T {
    return this.lst[this.idx];
  }

  pop(): T | undefined {
    if (this.idx === -1) {
      return undefined;
    }
    return this.lst.splice(this.idx, 1)[0];
  }

  move(predicate: (t: T) => boolean) {
    this.idx = this.lst.findIndex(predicate);
  }

  next(): T {
    const res = this.peek();
    this.idx++;
    return res;
  }

  done(): boolean {
    return this.idx >= this.lst.length;
  }
}
