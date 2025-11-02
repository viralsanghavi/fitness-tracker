import {useEffect, useMemo, useState} from 'react';
import useTrackerStore from '../store/useTrackerStore.js';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card.jsx';
import {Button} from './ui/button.jsx';
import {Input} from './ui/input.jsx';
import {Label} from './ui/label.jsx';
import {Select} from './ui/select.jsx';
import {Textarea} from './ui/textarea.jsx';
import GroupAssignmentCard from './admin/GroupAssignmentCard.jsx';

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : '');

const AdminPanelView = () => {
  const adminProfile = useTrackerStore((state) => state.adminProfile);
  const adminGroups = useTrackerStore((state) => state.adminGroups);
  const adminLoading = useTrackerStore((state) => state.adminLoading);
  const adminDirectory = useTrackerStore((state) => state.adminDirectory);
  const userDirectory = useTrackerStore((state) => state.userDirectory);
  const createGroup = useTrackerStore((state) => state.createGroup);
  const addGroupAdmin = useTrackerStore((state) => state.addGroupAdmin);
  const removeGroupAdmin = useTrackerStore((state) => state.removeGroupAdmin);
  const addGroupMember = useTrackerStore((state) => state.addGroupMember);
  const removeGroupMember = useTrackerStore((state) => state.removeGroupMember);
  const adminViewedEntries = useTrackerStore((state) => state.adminViewedEntries);
  const adminViewedLoading = useTrackerStore((state) => state.adminViewedLoading);
  const adminViewedUserEmail = useTrackerStore((state) => state.adminViewedUserEmail);
  const adminSubscribeToUserEntries = useTrackerStore((state) => state.adminSubscribeToUserEntries);
  const saveDietNote = useTrackerStore((state) => state.saveDietNote);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [reviewUserEmail, setReviewUserEmail] = useState('');
  const [noteDrafts, setNoteDrafts] = useState({});

  const selectedGroup = useMemo(
    () => adminGroups.find((group) => group.id === selectedGroupId) || null,
    [selectedGroupId, adminGroups]
  );

  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const manageableGroups = useMemo(
    () =>
      adminGroups.map((group) => ({
        ...group,
        canManage:
          isSuperAdmin ||
          (group.admins || [])
            .map((email) => email.toLowerCase())
            .includes((adminProfile?.email || '').toLowerCase()),
      })),
    [adminGroups, adminProfile?.email, isSuperAdmin]
  );

  const emailOptions = useMemo(() => {
    const map = new Map();
    const addEmail = (email, meta = {}) => {
      if (!email) return;
      const key = email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {email, ...meta});
      }
    };

    adminDirectory.forEach((admin) => {
      addEmail(admin.email, {role: admin.role || ''});
    });
    userDirectory.forEach((user) => {
      addEmail(user.email, {displayName: user.displayName || ''});
    });
    manageableGroups.forEach((group) => {
      (group.members || []).forEach((email) => addEmail(email));
      (group.admins || []).forEach((email) => addEmail(email, {role: 'group_admin'}));
    });

    return Array.from(map.values())
      .map((value) => ({
        email: value.email,
        label: value.displayName ? `${value.displayName} — ${value.email}` : value.email,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [adminDirectory, userDirectory, manageableGroups]);

  const userOptions = useMemo(() => {
    const normalizedUsers = new Map();
    userDirectory.forEach((user) => {
      if (!user.email) return;
      normalizedUsers.set(normalizeEmail(user.email), {
        email: user.email,
        displayName: user.displayName || '',
      });
    });

    manageableGroups.forEach((group) => {
      [...(group.members || []), ...(group.admins || [])].forEach((email) => {
        const normalized = normalizeEmail(email);
        if (!normalized || normalizedUsers.has(normalized)) return;
        normalizedUsers.set(normalized, {email, displayName: ''});
      });
    });

    return Array.from(normalizedUsers.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [userDirectory, manageableGroups]);

  const reviewOptions = useMemo(() => {
    if (isSuperAdmin) {
      return userOptions.map((user) => ({email: user.email, label: user.displayName ? `${user.displayName} — ${user.email}` : user.email}));
    }
    const allowed = new Set();
    manageableGroups
      .filter((group) => group.canManage)
      .forEach((group) => {
        (group.members || []).forEach((email) => allowed.add(normalizeEmail(email)));
        (group.admins || []).forEach((email) => allowed.add(normalizeEmail(email)));
      });
    return userOptions
      .filter((user) => allowed.has(normalizeEmail(user.email)))
      .map((user) => ({email: user.email, label: user.displayName ? `${user.displayName} — ${user.email}` : user.email}));
  }, [isSuperAdmin, manageableGroups, userOptions]);

  const handleCreateGroup = (event) => {
    event.preventDefault();
    createGroup({ name: groupName, description: groupDescription });
    setGroupName('');
    setGroupDescription('');
  };

  useEffect(() => {
    if (!reviewUserEmail && reviewOptions.length > 0) {
      setReviewUserEmail(reviewOptions[0].email);
    }
  }, [reviewOptions, reviewUserEmail]);

  useEffect(() => {
    if (reviewUserEmail) {
      adminSubscribeToUserEntries(reviewUserEmail);
    } else {
      setNoteDrafts({});
    }
  }, [reviewUserEmail, adminSubscribeToUserEntries]);

  useEffect(() => {
    if (!manageableGroups.length) {
      if (selectedGroupId) {
        setSelectedGroupId('');
      }
      return;
    }
    const exists = manageableGroups.some((group) => group.id === selectedGroupId);
    if (!exists) {
      setSelectedGroupId(manageableGroups[0].id);
    }
  }, [manageableGroups, selectedGroupId]);

  const headerCopy = adminProfile
    ? adminProfile.role === 'super_admin'
      ? 'Super admin access — manage groups, admins, and assignments.'
      : 'Group admin access — review the groups you manage.'
    : 'Request access from a super admin to view this panel.';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">Admin Console</h2>
        <p className="text-sm text-muted-foreground">{headerCopy}</p>
      </div>

      {adminLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading admin privileges…
          </CardContent>
        </Card>
      ) : !adminProfile ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            You do not have admin permissions yet. Contact a super admin to be added to a group.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {isSuperAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Create a new group</CardTitle>
                  <CardDescription>Spin up a fresh group for tracking and oversight.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateGroup}>
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group name</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder="e.g. Team Horizon"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">Description (optional)</Label>
                      <Textarea
                        id="groupDescription"
                        value={groupDescription}
                        onChange={(event) => setGroupDescription(event.target.value)}
                        placeholder="Add a few words about this group’s purpose."
                      />
                    </div>
                    <Button type="submit">Create group</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <GroupAssignmentCard
              groups={manageableGroups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              onAddAdmin={(groupId, email) => {
                addGroupAdmin(groupId, email);
              }}
              onRemoveAdmin={removeGroupAdmin}
              onAddMember={addGroupMember}
              onRemoveMember={removeGroupMember}
              adminOptions={emailOptions}
              memberOptions={userOptions.map((user) => ({
                email: user.email,
                label: user.displayName ? `${user.displayName} — ${user.email}` : user.email,
              }))}
            />
          </div>

        {reviewOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Diet oversight</CardTitle>
              <CardDescription>
                Review check-ins, switch users, and leave quick diet notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewUser">Choose user</Label>
                <Select
                  id="reviewUser"
                  value={reviewUserEmail}
                  onChange={(event) => setReviewUserEmail(event.target.value)}
                >
                  <option value="" disabled>
                    Select a user
                  </option>
                  {reviewOptions.map((option) => (
                    <option key={option.email} value={option.email}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {adminViewedLoading ? (
                <p className="text-sm text-muted-foreground">Loading user entries…</p>
              ) : adminViewedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {reviewUserEmail ? 'No entries logged yet for this user.' : 'Select a user to begin.'}
                </p>
              ) : (
                <div className="space-y-4">
                  {adminViewedEntries.map((entry) => {
                    const draft = noteDrafts[entry.date] || '';
                    const handleDraftChange = (value) =>
                      setNoteDrafts((prev) => ({...prev, [entry.date]: value}));
                    const handleSubmit = (event) => {
                      event.preventDefault();
                      saveDietNote({userEmail: reviewUserEmail, date: entry.date, note: draft});
                      setNoteDrafts((prev) => ({...prev, [entry.date]: ''}));
                    };
                    const dietNotes = Array.isArray(entry.dietNotes) ? entry.dietNotes : [];
                    return (
                      <div key={entry.date} className="rounded-2xl border border-muted/60 bg-muted/5 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.date}</p>
                            <p className="text-xs text-muted-foreground">
                              Water: {entry.water ?? 0} • Steps: {entry.steps ?? 0} • Meals logged: {(entry.meals || []).length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Mood: {entry.mood ?? '-'} • Screen time: {entry.screenTime ?? '-'} • Meal quality: {entry.mealQuality ?? '-'}
                            </p>
                          </div>
                        </div>

                        {dietNotes.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Notes
                            </p>
                            <ul className="space-y-1">
                              {dietNotes.map((noteItem, index) => (
                                <li
                                  key={`${entry.date}-note-${index}`}
                                  className="rounded-md bg-background/80 p-2 text-xs text-foreground"
                                >
                                  <span className="font-semibold">{noteItem.authorName || noteItem.author || 'Admin'}:</span>{' '}
                                  {noteItem.note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
                          <Label htmlFor={`note-${entry.date}`} className="text-xs font-semibold text-muted-foreground">
                            Leave a diet note
                          </Label>
                          <Textarea
                            id={`note-${entry.date}`}
                            value={draft}
                            onChange={(event) => handleDraftChange(event.target.value)}
                            placeholder="Summarise guidance or observations…"
                            rows={2}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={!draft.trim()} size="sm">
                              Save note
                            </Button>
                          </div>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Groups overview</h3>
              <p className="text-sm text-muted-foreground">
                {adminGroups.length === 0
                  ? 'No groups to display yet.'
                  : isSuperAdmin
                  ? 'All groups in the workspace.'
                  : 'Groups you help manage.'}
              </p>
            </div>
            {adminGroups.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? 'Create a group to get started with assignments.'
                    : 'You are not assigned to any groups yet. Contact a super admin for access.'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {manageableGroups.map((group) => {
                  const adminEmails = group.admins || [];
                  const memberEmails = group.members || [];
                  const canManageAdmins = group.canManage;
                  const canManageMembers = group.canManage;

                  return (
                    <Card key={group.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description ? (
                          <CardDescription>{group.description}</CardDescription>
                        ) : null}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Admins
                          </h4>
                          {adminEmails.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No admins assigned.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {adminEmails.map((email) => (
                                <div
                                  key={`${group.id}-${email}-admin`}
                                  className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                                >
                                  <span>{email}</span>
                                  {canManageAdmins && (
                                    <button
                                      type="button"
                                      className="text-[11px] font-semibold text-destructive hover:underline"
                                      onClick={() => removeGroupAdmin(group.id, email)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Members
                          </h4>
                          {memberEmails.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No members assigned.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {memberEmails.map((email) => (
                                <div
                                  key={`${group.id}-${email}-member`}
                                  className="flex items-center gap-2 rounded-full border border-muted/60 bg-muted/10 px-3 py-1 text-xs font-semibold text-muted-foreground"
                                >
                                  <span>{email}</span>
                                  {canManageMembers && (
                                    <button
                                      type="button"
                                      className="text-[11px] font-semibold text-destructive hover:underline"
                                      onClick={() => removeGroupMember(group.id, email)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminPanelView;
