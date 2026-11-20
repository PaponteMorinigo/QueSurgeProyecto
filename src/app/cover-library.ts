import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Auth } from './auth';

interface StoredCover {
  id: string;
  ownerId: string;
  name: string;
  image: Blob;
}
interface Cover extends StoredCover { url: string; }

@Injectable({ providedIn: 'root' })
export class CoverLibrary implements OnDestroy {
  private readonly auth = inject(Auth);
  private readonly records = signal<Cover[]>([]);
  private database: Promise<IDBDatabase> | null = null;
  readonly error = signal('');
  readonly own = computed(() => this.records().filter(cover => cover.ownerId === this.auth.user()?.id));
  readonly ready = this.load().catch(() => this.error.set('No se pudieron recuperar las portadas guardadas en este navegador.'));

  private open(): Promise<IDBDatabase> {
    if (!this.database) {
      this.database = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('que-surge-media', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('covers', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Cerrá las otras pestañas de Qué Surge e intentá nuevamente.'));
      }).catch(error => { this.database = null; throw error; });
    }
    return this.database;
  }

  private async load() {
    const database = await this.open();
    const covers = await new Promise<StoredCover[]>((resolve, reject) => {
      const request = database.transaction('covers').objectStore('covers').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    this.records.set(covers.map(cover => ({ ...cover, url: URL.createObjectURL(cover.image) })));
  }

  resolve(photo: string): string {
    if (!photo.startsWith('cover:')) return photo;
    return this.records().find(cover => cover.id === photo)?.url ?? 'eventos/pulso.jpg';
  }

  hasOwned(photo: string, ownerId: string) {
    return this.records().some(cover => cover.id === photo && cover.ownerId === ownerId);
  }

  async add(file: File, ownerId: string): Promise<string> {
    await this.ready;
    this.error.set('');
    if (this.auth.user()?.role !== 'company' || this.auth.user()?.id !== ownerId) {
      throw new Error('Ingresá con la cuenta de empresa que está cargando la portada.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Elegí una imagen JPG, PNG o WebP.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('La imagen debe pesar hasta 10 MB.');
    const temporaryUrl = URL.createObjectURL(file);
    const image = new Image();
    let optimized: Blob;
    try {
      image.src = temporaryUrl;
      await image.decode();
      if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40000000) {
        throw new Error('Usá una imagen de hasta 40 megapíxeles.');
      }
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo preparar la vista previa de la imagen.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      optimized = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo preparar la imagen.')), 'image/webp', .85));
    } catch (error) {
      if (error instanceof Error && error.name === 'EncodingError') throw new Error('El archivo no contiene una imagen válida.');
      throw error;
    } finally { URL.revokeObjectURL(temporaryUrl); }
    if (this.auth.user()?.id !== ownerId) throw new Error('La sesión cambió. Volvé a cargar la portada.');
    const cover: StoredCover = {
      id: 'cover:' + crypto.randomUUID(), ownerId, name: file.name, image: optimized
    };
    try {
      const database = await this.open();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('covers', 'readwrite');
        transaction.objectStore('covers').put(cover);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      throw new Error('No se pudo guardar la portada. Revisá el espacio disponible del navegador e intentá nuevamente.');
    }
    this.records.update(covers => [...covers, { ...cover, url: URL.createObjectURL(optimized) }]);
    return cover.id;
  }

  ngOnDestroy() { this.records().forEach(cover => URL.revokeObjectURL(cover.url)); }
}
