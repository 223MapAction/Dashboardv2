import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { People, Eye } from 'iconsax-react';
import { getOrganisationsService, formatOrganisation } from '../organisations/service/organisation_service';
import { createSuggestionService } from '../suggest-request/service/suggest_service';

/**
 * Suggerer des organisations partenaires sur une collaboration : la liste des
 * organisations disponibles, la selection en cours, les roles proposes et
 * l'envoi.
 *
 * @param {object|null} collaboration collaboration formatee
 */
export function useSuggestionsOrganisations(collaboration) {
  // États pour le modal de suggestion d'organisations
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [suggestModalClosing, setSuggestModalClosing] = useState(false);
  const [suggestModalShowing, setSuggestModalShowing] = useState(false);
  const [suggestSearch, setSuggestSearch] = useState('');
  const [suggestedOrgs, setSuggestedOrgs] = useState([]);
  const [suggestAlert, setSuggestAlert] = useState(null);
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);

  // Charger toutes les organisations depuis l'API
  const { data: orgsData } = useSWR(
    'organisations-list',
    async () => {
      try {
        const rawOrgs = await getOrganisationsService();
        return (rawOrgs || []).map(org => formatOrganisation(org)).filter(Boolean);
      } catch (err) {
        console.error('[CollaborationDetail] Erreur chargement organisations list:', err);
        return [];
      }
    },
    {
      revalidateOnFocus: false
    }
  );

  // Données pour les organisations disponibles
  const AVAILABLE_ORGS = useMemo(() => {
    return orgsData || [];
  }, [orgsData]);

  // Fermeture du modal de suggestion avec animation
  const closeSuggestModal = () => {
    setSuggestModalShowing(false);
    setSuggestModalClosing(true);
    setTimeout(() => {
      setShowSuggestModal(false);
      setSuggestModalClosing(false);
      setSuggestSearch('');
      setSuggestedOrgs([]);
      setSuggestAlert(null);
    }, 300);
  };

  // Envoi des suggestions d'organisations partenaires
  const handleSuggestSubmit = async () => {
    if (!suggestedOrgs.length || !collaboration?.id) return;
    setSuggestSubmitting(true);
    setSuggestAlert(null);
    const errors = [];
    const successes = [];



    const results = await Promise.allSettled(
      suggestedOrgs.map(org =>
        createSuggestionService(collaboration.incidentId, {
          incident: collaboration.incidentId,
          suggested_organisation: org.id,
          suggested_role: org.role === 'observateur' ? 'observer' : 'contributor',
          justification: org.comment || ''
        }).then(() => ({ ok: true, name: org.name }))
          .catch(err => {
            const data = err?.response?.data;
            let errorDetail = 'Erreur inconnue';
            if (data) {
              if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                const msg = data.non_field_errors[0];
                errorDetail = msg.includes('unique set')
                  ? 'déjà invitée ou suggérée pour cet incident'
                  : msg;
              } else if (data.detail) {
                errorDetail = data.detail;
              } else if (data.message) {
                errorDetail = data.message;
              } else {
                const keys = Object.keys(data);
                if (keys.length > 0) {
                  const val = data[keys[0]];
                  const msg = Array.isArray(val) ? val[0] : String(val);
                  errorDetail = msg.includes('unique set')
                    ? 'déjà invitée ou suggérée pour cet incident'
                    : msg;
                } else {
                  errorDetail = err?.message || 'Erreur inconnue';
                }
              }
            } else {
              errorDetail = err?.message || 'Erreur inconnue';
            }
            return {
              ok: false,
              name: org.name,
              detail: errorDetail
            };
          })
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.ok) successes.push(result.value.name);
        else errors.push(`${result.value.name} : ${result.value.detail}`);
      }
    }

    setSuggestSubmitting(false);
    if (errors.length === 0) {
      setSuggestAlert({ type: 'success', message: `Suggestion(s) envoyée(s) avec succès pour : ${successes.join(', ')}.` });
      setSuggestedOrgs([]);
      // Fermer le modal après un court délai pour que l'utilisateur voie le message de succès
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
    } else if (successes.length > 0) {
      setSuggestAlert({ type: 'warning', message: `Succès : ${successes.join(', ')}. Erreurs : ${errors.join(' | ')}` });
    } else {
      setSuggestAlert({ type: 'danger', message: errors.join(' | ') });
    }
  };

  // Gestion des organisations suggérées
  const toggleSuggestedOrg = (org) => {


    setSuggestedOrgs(prev => {
      const exists = prev.find(o => o.id === org.id);
      if (exists) {
        return prev.filter(o => o.id !== org.id);
      } else {
        return [...prev, { ...org, role: 'contributeur', comment: '' }];
      }
    });
  };

  const updateSuggestedRole = (orgId, roleId) => {
    setSuggestedOrgs(prev =>
      prev.map(org => org.id === orgId ? { ...org, role: roleId } : org)
    );
  };

  const updateSuggestedComment = (orgId, comment) => {
    setSuggestedOrgs(prev =>
      prev.map(org => org.id === orgId ? { ...org, comment } : org)
    );
  };

  // Options de rôles
  const ROLE_OPTIONS = [

    {
      id: 'contributeur',
      label: 'Contributeur',
      icon: People,
      color: 'var(--color-primary-text)',
      description: 'Peut participer activement et créer des tâches'
    },
    {
      id: 'observateur',
      label: 'Observateur',
      icon: Eye,
      color: 'var(--color-text-secondary)',
      description: 'Peut uniquement consulter les informations'
    }
  ];

  return {
    showSuggestModal, setShowSuggestModal,
    showReportsModal, setShowReportsModal,
    suggestModalClosing,
    suggestModalShowing, setSuggestModalShowing,
    closeSuggestModal,
    suggestSearch, setSuggestSearch,
    suggestedOrgs, toggleSuggestedOrg, updateSuggestedRole, updateSuggestedComment,
    suggestAlert, setSuggestAlert,
    suggestSubmitting, handleSuggestSubmit,
    AVAILABLE_ORGS,
    ROLE_OPTIONS,
  };
}
