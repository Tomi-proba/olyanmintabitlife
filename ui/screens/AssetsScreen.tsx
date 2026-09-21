import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';
import { SHOP_ITEMS } from '../../data/shop';

const TYPE_LABELS: Record<string, string> = {
  property: 'Property',
  car: 'Car',
  stock: 'Stock',
  crypto: 'Crypto',
};

export function AssetsScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const buyAsset = useAppStore((s) => s.buyAsset);
  const sellAsset = useAppStore((s) => s.sellAsset);

  if (!game) return null;
  const { player, assets } = game;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Bank Balance</Text>
        <Text style={[styles.balance, { color: player.money < 0 ? colors.danger : colors.text }]}>
          ${player.money.toLocaleString()}
        </Text>
      </Card>

      {assets.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Assets</Text>
          {assets.map((asset) => (
            <Card key={asset.id} style={styles.card}>
              <Text style={[styles.itemName, { color: colors.text }]}>{asset.name}</Text>
              <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>
                {TYPE_LABELS[asset.type]} · Worth ${asset.value.toLocaleString()}
                {asset.upkeepPerYear > 0 ? ` · $${asset.upkeepPerYear.toLocaleString()}/yr upkeep` : ''}
              </Text>
              <PrimaryButton label="Sell" variant="secondary" onPress={() => sellAsset(asset.id)} style={styles.fullButton} />
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop</Text>
      {SHOP_ITEMS.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>
            {TYPE_LABELS[item.type]} · ${item.price.toLocaleString()}
            {item.upkeepPerYear > 0 ? ` · $${item.upkeepPerYear.toLocaleString()}/yr upkeep` : ''}
          </Text>
          <PrimaryButton
            label="Buy"
            onPress={() => buyAsset(item.type, item.name, item.price, item.upkeepPerYear)}
            disabled={player.money < item.price}
            style={styles.fullButton}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  card: { marginBottom: 14 },
  balanceLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  balance: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  itemSubtitle: { fontSize: 13, marginBottom: 10 },
  fullButton: {},
});
