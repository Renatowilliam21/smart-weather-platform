import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapaEstacoes({ estacoes }) {
    const comCoordenadas = estacoes.filter((e) => e.latitude && e.longitude);
    const centro = comCoordenadas.length > 0
        ? [parseFloat(comCoordenadas[0].latitude), parseFloat(comCoordenadas[0].longitude)]
        : [-5.1, -39.1];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Localização das Estações</h3>
            {comCoordenadas.length > 0 ? (
                <MapContainer center={centro} zoom={10} style={{ height: '300px', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {comCoordenadas.map((estacao) => (
                        <Marker
                            key={estacao.id}
                            position={[parseFloat(estacao.latitude), parseFloat(estacao.longitude)]}
                        >
                            <Popup>
                                <strong>{estacao.nome}</strong>
                                <br />
                                {estacao.localizacao}
                                {estacao.ultima_leitura && (
                                    <>
                                        <br />
                                        ITGU: {estacao.ultima_leitura.itgu ?? '—'}
                                    </>
                                )}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            ) : (
                <p className="text-sm text-gray-400">Nenhuma estação com coordenadas cadastradas</p>
            )}
        </div>
    );
}
