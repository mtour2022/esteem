import React, { useRef } from 'react';
import { Card, Table, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

export default function TopRankingChart({ title = '', data = [], loading = false }) {
  const chartRef = useRef();
  const validData = data?.filter((d) => d?.value > 0).sort((a, b) => b.value - a.value).slice(0, 10) || [];
  const isReady = !loading && validData.length > 0;

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
      });
      download(dataUrl, `${title || 'ranking'}.png`, 'image/png');
    } catch (error) {
      console.error('Failed to download chart image:', error);
    }
  };

  return (
    <Card className="summary-card border rounded p-3 text-muted h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        {!loading && validData.length > 0 && (
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
          <small className="mt-2 text-muted">Loading ranking...</small>
        </div>
      ) : validData.length === 0 ? (
        <p className="text-center text-muted my-5">No data available</p>
      ) : (
        <div ref={chartRef}>
          <Table bordered size="sm" className="text-center small mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {validData.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
