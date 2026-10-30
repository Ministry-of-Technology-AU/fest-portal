// Minimal promise wrapper around IndexedDB for the offline roster and queue.
// Each call is its own transaction; nothing here needs more than one store at a time.

const DB_NAME = 'fest-portal'
const DB_VERSION = 1

export type StoreName = 'roster' | 'queue' | 'meta'
const STORES: StoreName[] = ['roster', 'queue', 'meta']

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('roster', { keyPath: 'id' })
      db.createObjectStore('queue', { keyPath: 'opId' })
      db.createObjectStore('meta')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })
  return dbPromise
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  operation: (objectStore: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode)
    const request = operation(transaction.objectStore(store))
    transaction.oncomplete = () => resolve(request ? request.result : undefined)
    transaction.onerror = transaction.onabort = () => reject(transaction.error)
  })
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return (await run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)) ?? []
}

export function get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return run<T>(store, 'readonly', (s) => s.get(key) as IDBRequest<T>)
}

/** Stores a value; `key` is only for stores without a keyPath (meta) */
export async function put(store: StoreName, value: unknown, key?: IDBValidKey) {
  await run(store, 'readwrite', (s) => {
    s.put(value, key)
  })
}

export async function putMany(store: StoreName, values: unknown[]) {
  if (values.length === 0) return
  await run(store, 'readwrite', (s) => {
    for (const value of values) s.put(value)
  })
}

/** Replaces a store's whole contents in one transaction */
export async function replaceAll(store: StoreName, values: unknown[]) {
  await run(store, 'readwrite', (s) => {
    s.clear()
    for (const value of values) s.put(value)
  })
}

export async function remove(store: StoreName, key: IDBValidKey) {
  await run(store, 'readwrite', (s) => {
    s.delete(key)
  })
}

export async function clearAll() {
  await Promise.all(
    STORES.map((store) =>
      run(store, 'readwrite', (s) => {
        s.clear()
      })
    )
  )
}
