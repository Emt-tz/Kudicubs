import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/core/widgets/widgets.dart';

Widget host(Widget child) => MaterialApp(theme: AppTheme.light, home: Scaffold(body: SingleChildScrollView(child: child)));

void main() {
  testWidgets('shared widgets render and react', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    var taps = 0, retries = 0;
    final digits = <String>[];
    await tester.pumpWidget(host(Column(children: [
      PrimaryButton(label: 'Let\'s Go', onPressed: () => taps++),
      const PrimaryButton(label: 'Off', onPressed: null),
      SecondaryButton(label: 'Later', onPressed: () => taps++),
      const KudiImage(KudiPose.wave, width: 100),
      StateBanner(message: 'No connection', kind: BannerKind.offline, onRetry: () => retries++),
      const ProgressDots(count: 3, index: 1),
      const CoinChip(amount: 120),
      const PinDots(filled: 2),
      const TextFieldKc(label: 'Email', errorText: 'Check it'),
      NumberPad(onDigit: digits.add, onDelete: () => digits.add('<')),
    ])));
    expect(tester.getSize(find.text('Let\'s Go')).height, greaterThan(0));
    await tester.tap(find.text('Let\'s Go'));
    await tester.tap(find.text('Later'));
    await tester.tap(find.text('Retry'));
    await tester.tap(find.text('7'));
    await tester.tap(find.byIcon(Icons.backspace_outlined));
    expect([taps, retries], [2, 1]);
    expect(digits, ['7', '<']);
    expect(find.text('120'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('state views show retry', (tester) async {
    var n = 0;
    await tester.pumpWidget(host(SizedBox(height: 600, child: ErrorView(onRetry: () => n++))));
    await tester.tap(find.text('Try again'));
    expect(n, 1);
    await tester.pumpWidget(host(const SizedBox(height: 600, child: EmptyView(title: 'Nothing yet'))));
    expect(find.text('Nothing yet'), findsOneWidget);
    await tester.pumpWidget(host(const SizedBox(height: 300, child: LoadingView(message: 'Hold on'))));
    expect(find.text('Hold on'), findsOneWidget);
  });
}
