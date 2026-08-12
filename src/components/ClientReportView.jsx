import React, { useMemo, useState } from 'react';
import LongevityBlueprintDashboard from './LongevityBlueprintDashboard';
import AikynetixOriginalReportView from './AikynetixOriginalReportView';
import useClientVideoUrl from '../hooks/useClientVideoUrl';
import {
  buildLongevityReportFromClient,
  getClientProfilePhoto,
} from '../utils/longevityReportData';
import { buildDeepCyberDashboardPayload } from '../utils/deepCyberPhaseParser';
import {
  resolveAikynetixReportUrl,
  resolveAikynetixSourceLabel,
} from '../utils/aikynetixReportUrl';

export default function ClientReportView({
  reportClient,
  reportCode,
  isCoachMode,
  onSaveReport,
  onNavigate,
}) {
  const [viewMode, setViewMode] = useState('blueprint');

  const { videoUrl, loading, hasMovementVideo, downloadVideo } = useClientVideoUrl(
    reportCode,
    reportClient
  );

  const baseReport = useMemo(
    () => buildLongevityReportFromClient(reportClient, reportCode),
    [reportClient, reportCode]
  );

  const reportPayload = useMemo(
    () => buildDeepCyberDashboardPayload(reportClient, reportCode, baseReport),
    [reportClient, reportCode, baseReport]
  );

  const activeVideoUrl = videoUrl || reportPayload.videoUrl || '';
  const aikynetixUrl = useMemo(() => resolveAikynetixReportUrl(reportClient), [reportClient]);
  const aikynetixSourceLabel = useMemo(
    () => resolveAikynetixSourceLabel(reportClient),
    [reportClient]
  );
  const pipelineSnapshot = reportClient?.longevityReport?.pipelineSnapshot || null;

  const comparisonProps = isCoachMode
    ? {
        showComparisonToggle: true,
        viewMode,
        onViewModeChange: setViewMode,
      }
    : {
        showComparisonToggle: false,
      };

  const blueprintVisible = viewMode === 'blueprint';
  const originalVisible = viewMode === 'original_aikynetix';

  return (
    <div
      className={`h-full w-full min-h-0 flex flex-col overflow-hidden${
        isCoachMode ? ' coach-report-export' : ''
      }`}
    >
      <div
        id="report-section-blueprint"
        className={`report-print-section flex-1 min-h-0 flex flex-col overflow-hidden ${
          blueprintVisible ? 'block' : 'hidden print:block'
        }`}
      >
        {isCoachMode ? (
          <div className="hidden print:block report-print-section-label">
            Review 01 // Cyber-Cyan Blueprint
          </div>
        ) : null}
        <LongevityBlueprintDashboard
          clientName={reportPayload.clientName}
          clientCode={reportPayload.clientCode}
          modelDataPhases={reportPayload.modelDataPhases}
          profilePhotoUrl={reportPayload.profilePhotoUrl}
          videoUrl={loading ? reportPayload.videoUrl : activeVideoUrl}
          totalFrames={reportPayload.totalFrames}
          mainTitle={reportPayload.mainTitle}
          testConfigKey={reportPayload.testConfigKey}
          showTestSimulator={isCoachMode && import.meta.env.DEV}
          archetypeVector={reportPayload.archetypeVector}
          caseLog={reportPayload.caseLog}
          narrativeLayout={reportPayload.narrativeLayout}
          editable={isCoachMode}
          hasMovementVideo={hasMovementVideo}
          onDownloadVideo={hasMovementVideo ? downloadVideo : undefined}
          useExternalPhaseNav={false}
          printAllPhases={!isCoachMode}
          pipelineSnapshot={pipelineSnapshot}
          dossierSnapshot={{
            profilePhotoUrl: getClientProfilePhoto(reportClient),
            videoUrl: activeVideoUrl || reportClient?.longevityReport?.videoUrl || '',
            archetypeVector: reportClient?.desc || '',
            caseLog: reportClient?.notes || '',
            narrativeLayout: reportClient?.longevityReport?.narrativeLayout || 'separate',
          }}
          onSaveReport={onSaveReport}
          escapeTarget={isCoachMode ? 'COACH_DASHBOARD_HOME' : 'CLIENT_PROFILE_HOME'}
          onNavigate={onNavigate}
          {...comparisonProps}
        />
      </div>

      {isCoachMode ? (
        <div
          id="report-section-original"
          className={`report-print-section flex-1 min-h-0 flex flex-col overflow-hidden coach-only-aikynetix-section ${
            originalVisible ? 'block' : 'hidden print:block'
          }`}
        >
          <div className="hidden print:block report-print-section-label">
            Review 02 // Original Aikynetix Intercept
          </div>
          <AikynetixOriginalReportView
            clientName={reportPayload.clientName}
            clientCode={reportPayload.clientCode}
            aikynetixUrl={aikynetixUrl}
            sourceLabel={aikynetixSourceLabel}
            pipelineSnapshot={pipelineSnapshot}
            onNavigate={onNavigate}
            escapeTarget="COACH_DASHBOARD_HOME"
            {...comparisonProps}
          />
        </div>
      ) : null}
    </div>
  );
}
