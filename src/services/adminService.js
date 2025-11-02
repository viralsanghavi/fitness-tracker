import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : '');

export const ensureAdminMetadataEntry = async (firestore, { email, displayName = '', defaultRole = 'user' }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, error: 'invalid-email' };

  const adminRef = doc(firestore, 'admin_metadata', normalized);
  try {
    const existing = await getDoc(adminRef);
    if (!existing.exists()) {
      await setDoc(
        adminRef,
        {
          email: normalized,
          displayName,
          role: defaultRole,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { ok: true, created: true };
    }

    const data = existing.data() || {};
    const updates = {};
    if (!data.email) updates.email = normalized;
    if (displayName && data.displayName !== displayName) updates.displayName = displayName;
    if (!data.role && defaultRole) updates.role = defaultRole;
    if (Object.keys(updates).length === 0) {
      return { ok: true, created: false };
    }

    updates.updatedAt = serverTimestamp();
    await updateDoc(adminRef, updates);
    return { ok: true, created: false };
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return { ok: false, error: 'permission-denied' };
    }
    return { ok: false, error };
  }
};

export const createGroup = async (firestore, { actorUid, name, description }) => {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    return { ok: false, error: 'Group name required' };
  }

  try {
    await addDoc(collection(firestore, 'groups'), {
      name: trimmedName,
      description: (description || '').trim(),
      admins: [],
      members: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actorUid,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
};

export const assignGroupAdmin = async (firestore, { groupId, adminEmail }) => {
  const normalized = normalizeEmail(adminEmail);
  if (!normalized) {
    return { ok: false, error: 'invalid-email' };
  }

  try {
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
      admins: arrayUnion(normalized),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(firestore, 'admin_metadata', normalized),
      {
        email: normalized,
        role: 'group_admin',
        managedGroupIds: arrayUnion(groupId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
};

export const removeGroupAdmin = async (firestore, { groupId, adminEmail }) => {
  const normalized = normalizeEmail(adminEmail);
  if (!normalized) {
    return { ok: false, error: 'invalid-email' };
  }

  try {
    await updateDoc(doc(firestore, 'groups', groupId), {
      admins: arrayRemove(normalized),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(firestore, 'admin_metadata', normalized),
      {
        email: normalized,
        managedGroupIds: arrayRemove(groupId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
};

export const assignGroupMember = async (firestore, { groupId, memberEmail }) => {
  const normalized = normalizeEmail(memberEmail);
  if (!normalized) {
    return { ok: false, error: 'invalid-email' };
  }

  try {
    await updateDoc(doc(firestore, 'groups', groupId), {
      members: arrayUnion(normalized),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
};

export const removeGroupMember = async (firestore, { groupId, memberEmail }) => {
  const normalized = normalizeEmail(memberEmail);
  if (!normalized) {
    return { ok: false, error: 'invalid-email' };
  }

  try {
    await updateDoc(doc(firestore, 'groups', groupId), {
      members: arrayRemove(normalized),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
};

export const subscribeToUserEntries = (firestore, { userId, callback, onError }) => {
  const entriesRef = collection(firestore, 'users', userId, 'entries');
  return onSnapshot(
    entriesRef,
    (snapshot) => {
      const payload = snapshot.docs
        .map((docSnap) => ({ date: docSnap.id, ...(docSnap.data() || {}) }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      callback(payload);
    },
    onError
  );
};

export const subscribeToGroups = (firestore, callback, onError) =>
  onSnapshot(collection(firestore, 'groups'), callback, onError);

export const fetchUserEntriesOnce = async (firestore, userId) => {
  const entriesRef = collection(firestore, 'users', userId, 'entries');
  const snapshot = await getDocs(entriesRef);
  return snapshot.docs
    .map((docSnap) => ({ date: docSnap.id, ...(docSnap.data() || {}) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};
