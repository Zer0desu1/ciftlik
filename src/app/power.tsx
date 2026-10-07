import { router } from 'expo-router';
import { Bot, Home, Lock, PlugZap, Sun, Wind, Zap } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CoinIcon } from '@/components/art/items';
import { Button, Card, IconBadge, Pill, Row, Screen, SectionHeader, Txt, TopBar } from '@/components/ui';
import { clockLabel, dayOf, weatherFor, weatherLabel } from '@/game/clock';
import { LAND_USES, MACHINES, POWER, SUN, WIND, type MachineId } from '@/game/data';
import { landCount, levelOf, powerBalance, powerMade, powerUsed, useGame } from '@/game/store';
import { C, F, S } from '@/theme';

const kwh = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kWh`;

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt v="caption" style={{ color: '#CFE3D3' }}>{label}</Txt>
      <Txt v="heading" style={{ color: tone ?? C.white }}>{value}</Txt>
    </View>
  );
}

function BuildCard({
  icon,
  title,
  sub,
  count,
  max,
  price,
  level,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  count: number;
  max: number;
  price: number;
  level: number;
  onPress: () => void;
}) {
  const coins = useGame((s) => s.coins);
  const locked = level > levelOf(useGame((s) => s.xp));
  const full = count >= max;
  return (
    <Card style={{ gap: S.md }}>
      <Row>
        <IconBadge tint={C.amberSoft}>{icon}</IconBadge>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="heading">{title}</Txt>
          <Txt v="caption">{sub}</Txt>
        </View>
        <Pill text={`${count} / ${max}`} tone={count ? 'green' : 'muted'} />
      </Row>
      {full ? (
        <Pill text="Bütün yerler dolu" tone="green" />
      ) : (
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={4}>
            <CoinIcon size={13} />
            <Txt v="caption">{price} altın</Txt>
            {locked ? <Pill text={`Seviye ${level}`} tone="muted" /> : null}
          </Row>
          <Button
            small
            label={locked ? 'Kilitli' : 'Kur'}
            icon={locked ? <Lock size={14} color={C.white} /> : <Zap size={14} color={C.white} />}
            onPress={onPress}
            disabled={locked || coins < price}
          />
        </Row>
      )}
    </Card>
  );
}

/**
 * Electricity: what the farm uses and makes right now, today's meter and what
 * it will come to at midnight, the bill if one is owed, and panels and
 * turbines to build.
 */
export default function PowerScreen() {
  const state = useGame();
  const { buyPower, payBill } = useGame.getState();
  const made = powerMade(state);
  const used = powerUsed(state);
  const balance = powerBalance(state);
  const weather = weatherFor(dayOf(state.minutes));
  const solarLand = landCount(state, 'solar');
  const machines = (Object.keys(state.machines) as MachineId[]).filter((id) => state.machines[id]?.on && MACHINES[id].power > 0);

  return (
    <Screen bottomGap={40} header={<TopBar title="Elektrik" subtitle={`${weatherLabel(weather.kind)} · ${clockLabel(state.minutes)}`} />}>
      <Card tint={C.green} style={{ gap: S.md }}>
        <Txt v="caption" style={{ color: '#CFE3D3' }}>Şu an</Txt>
        <Txt v="display" style={{ color: C.white }}>{made >= used ? 'Fazla üretiyorsun' : 'Şebekeden alıyorsun'}</Txt>
        <Row>
          <Stat label="Üretim" value={`${kwh(made)}/sa`} tone="#F2C94C" />
          <Stat label="Tüketim" value={`${kwh(used)}/sa`} />
        </Row>
        <View style={{ height: 1, backgroundColor: '#FFFFFF22' }} />
        <Txt v="caption" style={{ color: '#CFE3D3' }}>Bugün gece yarısına kadar</Txt>
        <Row>
          <Stat label="Üretilen" value={kwh(state.power.made)} />
          <Stat label="Tüketilen" value={kwh(state.power.used)} />
          <Stat label={balance > 0 ? 'Fatura' : 'Satış'} value={`${balance > 0 ? '−' : '+'}${Math.abs(balance)} altın`} tone={balance > 0 ? '#F4B4A8' : '#BFE6A8'} />
        </Row>
      </Card>

      {state.power.unpaid > 0 ? (
        <Card tint={C.roseSoft} style={{ gap: S.md }}>
          <Row>
            <IconBadge tint={C.white}>
              <PlugZap size={20} color={C.rose} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Txt v="heading">Ödenmemiş fatura: {state.power.unpaid} altın</Txt>
              <Txt v="caption">Ödenene kadar makineler ve robotlar çalışmıyor.</Txt>
            </View>
          </Row>
          <Button kind="danger" label={`Faturayı öde · ${state.power.unpaid} altın`} onPress={payBill} disabled={state.coins < state.power.unpaid} />
        </Card>
      ) : null}

      <Card style={{ gap: S.sm }}>
        <Txt v="label">Nasıl işler?</Txt>
        <Txt v="body">
          Ev ve çalışan makineler elektrik harcar. Ürettiğinden fazlasını harcarsan farkı şebekeden {POWER.buy} altın/kWh’ye alırsın;
          fazla üretirsen fazlası {POWER.sell} altın/kWh’den satılır. Hesap her gece yarısı kapanır.
        </Txt>
      </Card>

      <SectionHeader title="Üretim" subtitle={`Bugünkü hava: güneş %${Math.round(SUN[weather.kind] * 100)}, rüzgâr %${Math.round(WIND[weather.kind] * 100)}`} />
      <BuildCard
        icon={<Sun size={20} color={C.amber} />}
        title="Güneş paneli"
        sub={`Çatıya kurulur · öğlen ${POWER.panel.kwh} kWh/sa, gece üretmez`}
        count={state.power.panels}
        max={POWER.panel.max}
        price={POWER.panel.price}
        level={POWER.panel.level}
        onPress={() => buyPower('panel')}
      />
      <BuildCard
        icon={<Wind size={20} color={C.amber} />}
        title="Rüzgâr türbini"
        sub={`Gece gündüz ${POWER.turbine.kwh} kWh/sa · fırtınada daha çok`}
        count={state.power.turbines}
        max={POWER.turbine.max}
        price={POWER.turbine.price}
        level={POWER.turbine.level}
        onPress={() => buyPower('turbine')}
      />
      <Card onPress={() => router.push('/upgrades')} tint={C.amberSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        <Sun size={22} color={C.amber} />
        <View style={{ flex: 1 }}>
          <Txt v="label">Güneş tarlası{solarLand ? ` · ${solarLand} tane` : ''}</Txt>
          <Txt v="caption">
            Bir araziyi güneş tarlasına çevir: öğlen {LAND_USES.solar.adds} kWh/sa. Haritada araziye dokun.
          </Txt>
        </View>
      </Card>

      <SectionHeader title="Tüketim" subtitle="Saatte harcanan elektrik" />
      <Card style={{ gap: S.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8}>
            <Home size={16} color={C.inkSoft} />
            <Txt v="body">Ev</Txt>
          </Row>
          <Txt v="label">{kwh(POWER.house)}</Txt>
        </Row>
        {machines.map((id) => (
          <Row key={id} style={{ justifyContent: 'space-between' }}>
            <Row gap={8}>
              <Bot size={16} color={C.inkSoft} />
              <Txt v="body">{MACHINES[id].name}</Txt>
            </Row>
            <Txt v="label">{state.power.unpaid > 0 ? 'durdu' : kwh(MACHINES[id].power)}</Txt>
          </Row>
        ))}
        {!machines.length ? <Txt v="caption">Çalışan makine yok.</Txt> : null}
      </Card>

      {state.power.history.length ? (
        <>
          <SectionHeader title="Geçmiş" subtitle="Son günlerin elektrik hesabı" />
          <Card style={{ gap: S.sm }}>
            {state.power.history.map((h) => (
              <Row key={h.day} style={{ justifyContent: 'space-between' }}>
                <Txt v="body" style={{ fontFamily: F.semibold }}>{h.day}. gün</Txt>
                <Txt v="caption">
                  {h.made} kWh üretim · {h.used} kWh tüketim
                </Txt>
                <Txt v="label" style={{ color: h.net > 0 ? C.rose : C.green }}>
                  {h.net > 0 ? `−${h.net}` : `+${-h.net}`}
                </Txt>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
