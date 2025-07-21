import React, { useRef, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

const COLORS = [
    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#C9CBCF',
];

function SummaryPieChart({ title = "", data = [], loading = false }) {
    const chartRef = useRef();

    const validData = useMemo(() =>
        (data || []).filter(d => typeof d.value === 'number' && d.value > 0),
        [data]
    );

    const total = useMemo(() =>
        validData.reduce((sum, item) => sum + item.value, 0),
        [validData]
    );

    const handleDownload = async () => {
        if (!chartRef.current) return;
        try {
            const dataUrl = await toPng(chartRef.current, {
                backgroundColor: '#ffffff'
            });
            download(dataUrl, `${title || 'chart'}.png`, 'image/png');
        } catch (error) {
            console.error('Failed to download chart image:', error);
        }
    };

    const showNoData = !loading && validData.length === 0;

    return (
        <Card className="summary-card border rounded p-3 text-muted h-100 bg-white"  ref={chartRef}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{title}</h6>
                {!loading && total > 0 && (
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleDownload}
                        title="Download chart"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 200 }}>
                    <Spinner animation="border" variant="primary" />
                    <small className="mt-2 text-muted">Loading chart...</small>
                </div>
            ) : showNoData ? (
                <div className="text-center text-muted my-5">No data available</div>
            ) : (
                <div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={validData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                                labelLine
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(1)}%`
                                }
                            >
                                {validData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-2 small">
                        {validData.map((item, index) => (
                            <div key={index} className="d-flex justify-content-between px-2">
                                <span>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: COLORS[index % COLORS.length],
                                            marginRight: 8
                                        }}
                                    />
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}

export default React.memo(SummaryPieChart);
