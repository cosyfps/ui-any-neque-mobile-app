import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProgressPhoto } from '@app/domain/progress/model/progress-photo.model';
import { ProgressPhotosPort } from '@app/domain/progress/port/progress-photos.port';
import { Id } from '@app/domain/shared/model/ids';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_PROGRESS_PHOTOS } from './seed/photos.seed';

@Injectable()
export class ProgressPhotosMockAdapter implements ProgressPhotosPort {
  private photos: ProgressPhoto[] = cloneSeed(SEED_PROGRESS_PHOTOS) as ProgressPhoto[];
  private nextId = SEED_PROGRESS_PHOTOS.length + 1;

  /** Ordenadas de la mas reciente a la mas antigua. */
  listByStudent(studentId: Id): Observable<ProgressPhoto[]> {
    return simulate(
      this.photos
        .filter(photo => photo.studentId === studentId)
        .sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
    );
  }

  add(input: Omit<ProgressPhoto, 'id'>): Observable<ProgressPhoto> {
    const created: ProgressPhoto = {
      ...input,
      id: `pht-${String(this.nextId++).padStart(3, '0')}`,
    };
    this.photos = [...this.photos, created];
    return simulate(created);
  }

  remove(photoId: Id): Observable<void> {
    if (!this.photos.some(photo => photo.id === photoId)) {
      return simulateError<void>('not_found');
    }
    this.photos = this.photos.filter(photo => photo.id !== photoId);
    return simulate<void>(undefined);
  }
}
