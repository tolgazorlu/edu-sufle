'use client';

import React, {useCallback, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Download, Loader2} from 'lucide-react';
import {useReactFlow} from '@xyflow/react';
import {toPng} from 'html-to-image';
import {toast} from 'sonner';

export interface ExportButtonProps {
    filename?: string;
    className?: string;
}

export const ExportButton = ({filename = 'mindmap', className}: ExportButtonProps) => {
    const {getNodes} = useReactFlow();
    const reactFlowInstance = useReactFlow();
    const [isExporting, setIsExporting] = useState(false);

    const exportToPdf = useCallback(() => {
        // Check if there are nodes to export
        if (getNodes().length === 0) {
            toast.error('No mindmap to export');
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading('Generating PDF...');

        // Find the react-flow wrapper element
        const flowWrapper = document.querySelector('.react-flow') as HTMLElement;
        if (!flowWrapper) {
            toast.error('Could not find the mindmap canvas');
            setIsExporting(false);
            return;
        }

        // Temporarily hide controls and panels before export
        const controls = flowWrapper.querySelector('.react-flow__controls') as HTMLElement | null;
        const panels = flowWrapper.querySelectorAll('.react-flow__panel');
        const attribution = flowWrapper.querySelector('.react-flow__attribution') as HTMLElement | null;

        // Save original display styles
        const controlsDisplay = controls?.style.display;
        const panelsDisplays = Array.from(panels).map(panel => (panel as HTMLElement).style.display);

        // Hide elements
        if (controls) controls.style.display = 'none';
        panels.forEach(panel => ((panel as HTMLElement).style.display = 'none'));
        if (attribution) attribution.style.display = 'none';

        // Convert the flow to an image without changing the view
        toPng(flowWrapper, {
            backgroundColor: '#F7F9FB',
            quality: 1,
            pixelRatio: 2,
            canvasWidth: flowWrapper.offsetWidth,
            canvasHeight: flowWrapper.offsetHeight,
            filter: node => {
                // Filter out UI controls from the export
                return (
                    !node.classList?.contains('react-flow__panel') &&
                    !node.classList?.contains('react-flow__controls') &&
                    !node.classList?.contains('react-flow__attribution')
                );
            },
        })
            .then(dataUrl => {
                // Restore visibility after image generation
                if (controls) controls.style.display = controlsDisplay || '';
                panels.forEach((panel, i) => ((panel as HTMLElement).style.display = panelsDisplays[i] || ''));
                if (attribution) attribution.style.display = '';

                // Use setTimeout to prevent UI blocking
                setTimeout(() => {
                    try {
                        // Dynamically import jsPDF
                        import('jspdf')
                            .then(({jsPDF}) => {
                                try {
                                    // Create PDF document
                                    const pdf = new jsPDF({
                                        orientation: flowWrapper.offsetWidth > flowWrapper.offsetHeight ? 'landscape' : 'portrait',
                                        unit: 'px',
                                        format: [flowWrapper.offsetWidth, flowWrapper.offsetHeight],
                                    });

                                    // Add the image to the PDF
                                    pdf.addImage(dataUrl, 'PNG', 0, 0, flowWrapper.offsetWidth, flowWrapper.offsetHeight);

                                    // Save the PDF
                                    pdf.save(`${filename}.pdf`);
                                    toast.dismiss(toastId);
                                    toast.success('PDF exported successfully');
                                    setIsExporting(false);
                                } catch (pdfError) {
                                    console.error('PDF generation failed:', pdfError);
                                    toast.dismiss(toastId);
                                    toast.error('Failed to export PDF');
                                    setIsExporting(false);
                                }
                            })
                            .catch(importError => {
                                console.error('Failed to import jsPDF:', importError);
                                toast.dismiss(toastId);
                                toast.error('Failed to load PDF export module');
                                setIsExporting(false);
                            });
                    } catch (error) {
                        console.error('Error in PDF export:', error);
                        toast.dismiss(toastId);
                        toast.error('Failed to export PDF');
                        setIsExporting(false);
                    }
                }, 100); // Small delay to allow UI to update
            })
            .catch(error => {
                // Restore visibility in case of error
                if (controls) controls.style.display = controlsDisplay || '';
                panels.forEach((panel, i) => ((panel as HTMLElement).style.display = panelsDisplays[i] || ''));
                if (attribution) attribution.style.display = '';

                console.error('Error exporting to image:', error);
                toast.dismiss(toastId);
                toast.error('Failed to export PDF');
                setIsExporting(false);
            });
    }, [getNodes, reactFlowInstance, filename]);

    return (
        <Button onClick={exportToPdf} className={className} variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                </>
            )}
        </Button>
    );
};
