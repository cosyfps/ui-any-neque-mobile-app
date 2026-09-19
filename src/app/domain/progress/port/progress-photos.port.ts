import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { ProgressPhoto } from '../model/progress-photo.model';

export interface ProgressPhotosPort {
  listByStudent(studentId: Id): Observable<ProgressPhoto[]>;
  add(input: Omit<ProgressPhoto, 'id'>): Observable<ProgressPhoto>;
  remove(photoId: Id): Observable<void>;
}

export const PROGRESS_PHOTOS_PORT = new InjectionToken<ProgressPhotosPort>('ProgressPhotosPort');
