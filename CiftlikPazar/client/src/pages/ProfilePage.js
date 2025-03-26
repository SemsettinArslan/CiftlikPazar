import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const ProfilePage = () => {
  return (
    <div className="bg-light min-vh-100 d-flex align-items-center">
      <Container className="text-center">
        <Alert variant="warning" className="py-4">
          <h4 className="mb-3">Bu sayfa henüz hazır değil</h4>
          <p className="mb-0">Profil sayfası geliştirme aşamasındadır.</p>
        </Alert>
      </Container>
    </div>
  );
};

export default ProfilePage; 