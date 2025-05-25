// src/pages/StudentDashboardPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef
import { useAuth } from '../contexts/AuthContext';
import { fetchMyQrCodeImage } from '../api/barcodeService';
import { fetchMyOwnParticipationHistory } from '../api/eventService'; 
import { Card, Typography, Spin, Alert, Button, Image as AntImage, List, Statistic, Divider } from 'antd';
import { CalendarOutlined } from '@ant-design/icons'; 
import format from 'date-fns/format'; 
import parseISO from 'date-fns/parseISO'; 
import enUS from 'date-fns/locale/en-US'; 

const { Title: PageTitle, Paragraph, Text } = Typography;

const StudentDashboardPage = () => {
    const { currentUser, getUserTypeString, getAuthHeader } = useAuth();
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isLoadingQr, setIsLoadingQr] = useState(false);
    const [qrError, setQrError] = useState('');

    const [participationHistory, setParticipationHistory] = useState([]);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState('');

    // Ref to keep track of the current object URL to prevent unnecessary revocations/re-creations
    const currentObjectUrlRef = useRef(null);

    const loadQrCode = useCallback(async (isRefresh = false) => { 
        if (!currentUser || currentUser.typeValue !== 2) return;

        // Only show loading spinner on explicit refresh or if no QR code yet
        if (isRefresh || !currentObjectUrlRef.current) {
            setIsLoadingQr(true);
        }
        setQrError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setQrError("Authentication required."); 
            setIsLoadingQr(false); 
            return;
        }

        try {
            const imageBlob = await fetchMyQrCodeImage(authHeader);
            const newImageUrl = URL.createObjectURL(imageBlob);

            // Revoke previous object URL if it exists and is different
            if (currentObjectUrlRef.current && currentObjectUrlRef.current !== newImageUrl) {
                URL.revokeObjectURL(currentObjectUrlRef.current);
            }
            
            currentObjectUrlRef.current = newImageUrl; // Update ref before state
            setQrCodeUrl(newImageUrl);

        } catch (err) {
            console.error("Error fetching QR code:", err);
            setQrError(err.message || "Failed to load your QR code.");
            if (currentObjectUrlRef.current) { // If an error occurs, revoke any existing URL if we were trying to replace it
                URL.revokeObjectURL(currentObjectUrlRef.current);
                currentObjectUrlRef.current = null;
                setQrCodeUrl(null);
            }
        } finally {
            setIsLoadingQr(false);
        }
    }, [currentUser, getAuthHeader]); // Removed qrCodeUrl from here

    const loadParticipationStats = useCallback(async () => {
        if (!currentUser || currentUser.typeValue !== 2) return;
        setIsLoadingStats(true);
        setStatsError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setStatsError("Authentication required."); setIsLoadingStats(false); return;
        }

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const now = new Date();

            const history = await fetchMyOwnParticipationHistory(
                authHeader,
                thirtyDaysAgo.getTime(),
                now.getTime()
            );
            setParticipationHistory(history || []);
        } catch (err) {
            console.error("Error fetching participation history:", err);
            setStatsError(`Could not load participation history: ${err.message}.`);
            setParticipationHistory([]);
        } finally {
            setIsLoadingStats(false);
        }
    }, [currentUser, getAuthHeader]);

    // Effect for initial data loading
    useEffect(() => {
        if (currentUser && currentUser.typeValue === 2) {
            loadQrCode(true); // Pass true for initial load to show spinner
            loadParticipationStats();
        }
    }, [currentUser, loadQrCode, loadParticipationStats]); // Dependencies are stable now

    // Effect for cleaning up the object URL on unmount
    useEffect(() => {
        // Return a cleanup function that will be called when the component unmounts
        return () => {
            if (currentObjectUrlRef.current) {
                URL.revokeObjectURL(currentObjectUrlRef.current);
                // console.log("Revoked QR Code URL on unmount:", currentObjectUrlRef.current);
                currentObjectUrlRef.current = null; 
            }
        };
    }, []); // Empty dependency array means this cleanup runs only on unmount

    const participationSummary = React.useMemo(() => {
        if (!participationHistory || participationHistory.length === 0) {
            return { total: 0, recentEvents: [] };
        }
        return {
            total: participationHistory.length,
            recentEvents: participationHistory
                .sort((a, b) => parseISO(b.eventEntryDate).getTime() - parseISO(a.eventEntryDate).getTime()) 
                .slice(0, 5) 
                .map(p => ({name: p.eventName, date: p.eventEntryDate, key: `${p.eventName}-${p.eventEntryDate}-${Math.random()}`})),
        };
    }, [participationHistory]);

    const formatDisplayDate = (dateString) => {
        try {
            if (!dateString) return "N/A";
            return format(parseISO(dateString), 'Pp', { locale: enUS });
        } catch (e) {
            console.error("Error displaying date:", dateString, e);
            return "Invalid Date";
        }
    };

    if (!currentUser || currentUser.typeValue !== 2) {
        return <p style={{color: 'red', padding: '20px'}}>Access Denied. This dashboard is for students.</p>;
    }

    return (
        <div>
            <PageTitle level={2} style={{marginBottom: '24px'}}>Student Dashboard</PageTitle>
            <Paragraph>
                Welcome, <Text strong>{currentUser.name}</Text>! (Role: {getUserTypeString(currentUser.typeValue)}, Badge: {currentUser.badge})
            </Paragraph>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                <Card title="My QR Code for Event Check-in" style={{ flex: '1 1 300px', minWidth: '280px', textAlign: 'center' }}>
                    {isLoadingQr && <Spin tip="Generating QR Code..." style={{display: 'block', margin: '20px 0'}} />}
                    {qrError && !isLoadingQr && <Alert message={qrError} type="error" showIcon />}
                    {!isLoadingQr && !qrError && qrCodeUrl && (
                        <>
                            <AntImage width={200} height={200} src={qrCodeUrl} alt="My QR Code" preview={false} style={{border: '1px solid #f0f0f0', borderRadius: '4px', marginBottom: '10px'}}/>
                            <Paragraph type="secondary" style={{fontSize: '0.9em'}}>
                                Present this QR code for event check-in. It refreshes periodically for security.
                            </Paragraph>
                        </>
                    )}
                     {!isLoadingQr && !qrCodeUrl && !qrError && (
                        <Paragraph>Could not load QR code. <Button type="link" onClick={() => loadQrCode(true)}>Try again</Button></Paragraph>
                    )}
                    <Button onClick={() => loadQrCode(true)} style={{marginTop: '15px'}} disabled={isLoadingQr} block>
                        Refresh QR Code
                    </Button>
                </Card>

                <Card title="My Event Participation (Last 30 Days)" style={{ flex: '2 1 450px', minWidth: '350px' }}>
                    {isLoadingStats && <Spin tip="Loading statistics..." />}
                    {statsError && !isLoadingStats && <Alert message={statsError} type="error" showIcon />}
                    {!isLoadingStats && !statsError && (
                        <>
                            <Statistic title="Total Participations" value={participationSummary.total} prefix={<CalendarOutlined />} style={{marginBottom: '24px'}} />
                            <Divider />
                            {participationSummary.recentEvents.length > 0 ? (
                                <>
                                 <PageTitle level={5} style={{marginTop: '0px', marginBottom: '12px'}}>Recent Activity:</PageTitle>
                                 <List
                                    size="small"
                                    bordered
                                    dataSource={participationSummary.recentEvents}
                                    renderItem={item => (
                                        <List.Item>
                                            <Text strong>{item.name}</Text> - <Text type="secondary">{formatDisplayDate(item.date)}</Text>
                                        </List.Item>
                                    )}
                                />
                                </>
                            ) : (
                                <Paragraph>No participation data found for the last 30 days.</Paragraph>
                            )}
                        </>
                    )}
                     {!isLoadingStats && statsError && participationSummary.total === 0 && ( 
                        <Paragraph>Could not load participation statistics at this time.</Paragraph>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboardPage;