import React, { useRef, useState } from 'react';
import { Card, Table, Spinner, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

export default function TopRankingChart({ title = '', data = [], loading = false }) {
  const chartRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);
  const [topCount, setTopCount] = useState(10); // Default = Top 10

  const sortedData = data?.filter((d) => d?.value > 0).sort((a, b) => b.value - a.value) || [];
  const validData = topCount === "all" ? sortedData : sortedData.slice(0, topCount);
  const isReady = !loading && validData.length > 0;

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
      });
      download(dataUrl, `${title || 'ranking'}.png`, 'image/png');
    } catch (error) {
      console.error('Failed to download chart image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="summary-card border rounded p-3 text-muted h-100 bg-white" ref={chartRef}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        <div className="d-flex align-items-center gap-2">


          {!loading && sortedData.length > 0 && !isDownloading && (
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
      </div>

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 200 }}>
          <Spinner animation="border" variant="primary" />
          <small className="mt-2 text-muted">Loading ranking...</small>
        </div>
      ) : validData.length === 0 ? (
        <p className="text-center text-muted my-5">No data available</p>
      ) : (
        <div>
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
      {/* Dropdown for Top N selection */}

      <div className="d-flex justify-content-end mt-2">
        <Form.Select
          size="sm"
          value={topCount}
          onChange={(e) => setTopCount(e.target.value === "all" ? "all" : Number(e.target.value))}
          style={{ width: "auto" }}
        >
          <option value={3}>Top 3</option>
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value="all">All Data</option>
        </Form.Select>
      </div>

    </Card>
  );
}
