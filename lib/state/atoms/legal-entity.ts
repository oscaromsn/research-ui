import { atom } from 'jotai';

/**
 * Represents a legal entity found in analyzed documents
 */
export interface LegalEntity {
  name: string;
  type: 'Case' | 'Statute' | 'Regulation' | 'Person' | 'Organization' | 'LegalConcept' | 'Jurisdiction';
  details?: string;
}

// Atoms
export const legalEntitiesAtom = atom<LegalEntity[]>([]);

// Derived atoms
export const caseEntitiesAtom = atom(
  (get) => get(legalEntitiesAtom).filter(entity => entity.type === 'Case')
);

export const statuteEntitiesAtom = atom(
  (get) => get(legalEntitiesAtom).filter(entity => entity.type === 'Statute')
);

// Action atoms
export const addLegalEntityAtom = atom(
  null,
  (get, set, entity: LegalEntity) => {
    const entities = get(legalEntitiesAtom);
    // Avoid duplicates by name and type
    const exists = entities.some(
      e => e.name === entity.name && e.type === entity.type
    );
    
    if (!exists) {
      set(legalEntitiesAtom, [...entities, entity]);
    }
  }
);

export const addLegalEntitiesAtom = atom(
  null,
  (get, set, newEntities: LegalEntity[]) => {
    const currentEntities = get(legalEntitiesAtom);
    
    // Filter out duplicates
    const uniqueNewEntities = newEntities.filter(
      newEntity => !currentEntities.some(
        current => current.name === newEntity.name && current.type === newEntity.type
      )
    );
    
    if (uniqueNewEntities.length > 0) {
      set(legalEntitiesAtom, [...currentEntities, ...uniqueNewEntities]);
    }
  }
);

export const clearLegalEntitiesAtom = atom(
  null,
  (_, set) => {
    set(legalEntitiesAtom, []);
  }
);