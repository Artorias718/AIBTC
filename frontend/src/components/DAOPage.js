import React, { useState } from 'react';
import './DAOPage.css';

const DAOPage = () => {
  const [activeTab, setActiveTab] = useState('proposals');

  const proposals = [
    {
      id: 1,
      title: "Increase Community Treasury Allocation",
      description: "Proposal to increase the community treasury allocation from 20% to 30% of total funds to support more community initiatives.",
      status: "Active",
      votesFor: 1250,
      votesAgainst: 320,
      endDate: "2024-01-15",
      proposer: "0x1234...5678"
    },
    {
      id: 2,
      title: "Implement New Governance Framework",
      description: "Introduce a new governance framework that includes quadratic voting and delegation mechanisms.",
      status: "Passed",
      votesFor: 2100,
      votesAgainst: 450,
      endDate: "2024-01-10",
      proposer: "0x9876...5432"
    },
    {
      id: 3,
      title: "Partnership with DeFi Protocol",
      description: "Establish a strategic partnership with a leading DeFi protocol to expand our ecosystem.",
      status: "Draft",
      votesFor: 0,
      votesAgainst: 0,
      endDate: "2024-01-20",
      proposer: "0x4567...8901"
    }
  ];

  const members = [
    { address: "0x1234...5678", tokens: 5000, joined: "2023-01-15" },
    { address: "0x9876...5432", tokens: 3200, joined: "2023-02-20" },
    { address: "0x4567...8901", tokens: 2800, joined: "2023-03-10" },
    { address: "0x7890...1234", tokens: 2100, joined: "2023-04-05" },
    { address: "0x3456...7890", tokens: 1800, joined: "2023-05-12" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Passed': return 'status-passed';
      case 'Failed': return 'status-failed';
      case 'Draft': return 'status-draft';
      default: return 'status-draft';
    }
  };

  return (
    <div className="dao-page">
      <div className="container">
        {/* Header */}
        <div className="dao-header">
          <h1>DAO Governance</h1>
          <p>Participate in decentralized decision-making and shape the future of our community</p>
        </div>

        {/* Stats Cards */}
        <div className="dao-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-number">1,247</div>
              <div className="stat-label">Active Members</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-number">$2.5M</div>
              <div className="stat-label">Treasury</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-number">47</div>
              <div className="stat-label">Proposals</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗳️</div>
            <div className="stat-info">
              <div className="stat-number">89%</div>
              <div className="stat-label">Participation</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dao-tabs">
          <button 
            className={`tab-button ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            Proposals
          </button>
          <button 
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button 
            className={`tab-button ${activeTab === 'treasury' ? 'active' : ''}`}
            onClick={() => setActiveTab('treasury')}
          >
            Treasury
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'proposals' && (
            <div className="proposals-section">
              <div className="section-header">
                <h2>Active Proposals</h2>
                <button className="btn btn-primary">Create Proposal</button>
              </div>
              
              <div className="proposals-list">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="proposal-card">
                    <div className="proposal-header">
                      <h3>{proposal.title}</h3>
                      <span className={`status-badge ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="proposal-description">{proposal.description}</p>
                    <div className="proposal-details">
                      <div className="proposal-meta">
                        <span>Proposer: {proposal.proposer}</span>
                        <span>Ends: {proposal.endDate}</span>
                      </div>
                      <div className="proposal-votes">
                        <div className="vote-bar">
                          <div className="vote-for">
                            <span>For: {proposal.votesFor}</span>
                          </div>
                          <div className="vote-against">
                            <span>Against: {proposal.votesAgainst}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="proposal-actions">
                      <button className="btn btn-primary btn-small">Vote</button>
                      <button className="btn btn-secondary btn-small">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-section">
              <div className="section-header">
                <h2>Community Members</h2>
                <div className="search-box">
                  <input type="text" placeholder="Search members..." />
                </div>
              </div>
              
              <div className="members-list">
                {members.map((member, index) => (
                  <div key={index} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.address.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <div className="member-address">{member.address}</div>
                        <div className="member-joined">Joined: {member.joined}</div>
                      </div>
                    </div>
                    <div className="member-tokens">
                      <div className="token-amount">{member.tokens.toLocaleString()}</div>
                      <div className="token-label">Tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="treasury-section">
              <div className="section-header">
                <h2>Treasury Overview</h2>
                <button className="btn btn-primary">Add Funds</button>
              </div>
              
              <div className="treasury-cards">
                <div className="treasury-card">
                  <h3>Total Value</h3>
                  <div className="treasury-amount">$2,547,892</div>
                  <div className="treasury-change">+12.5% this month</div>
                </div>
                <div className="treasury-card">
                  <h3>Available Funds</h3>
                  <div className="treasury-amount">$1,234,567</div>
                  <div className="treasury-change">Ready for allocation</div>
                </div>
                <div className="treasury-card">
                  <h3>Allocated Funds</h3>
                  <div className="treasury-amount">$1,313,325</div>
                  <div className="treasury-change">In active proposals</div>
                </div>
              </div>

              <div className="recent-transactions">
                <h3>Recent Transactions</h3>
                <div className="transaction-list">
                  <div className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">Proposal Funding</div>
                      <div className="transaction-date">2024-01-12</div>
                    </div>
                    <div className="transaction-amount">-$50,000</div>
                  </div>
                  <div className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">Treasury Deposit</div>
                      <div className="transaction-date">2024-01-10</div>
                    </div>
                    <div className="transaction-amount">+$25,000</div>
                  </div>
                  <div className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">Community Grant</div>
                      <div className="transaction-date">2024-01-08</div>
                    </div>
                    <div className="transaction-amount">-$10,000</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DAOPage;
