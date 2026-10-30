from html.parser import HTMLParser
from pathlib import Path
import sys

GROUPS = {
    'aesthetics': 'زیبایی پزشکی', 'barbering': 'آرایشگری مردانه',
    'body-and-skin': 'بدن و پوست', 'counselling-and-therapy': 'مشاوره و درمان',
    'dental': 'دندانپزشکی', 'eyebrows-and-eyelashes': 'ابرو و مژه',
    'facials-and-skincare': 'صورت و مراقبت از پوست', 'hair-and-styling': 'مو و آرایش مو',
    'hair-removal': 'موزدایی', 'health-and-fitness': 'سلامت و تناسب اندام',
    'holistic-health': 'سلامت جامع', 'makeup': 'آرایش', 'massage': 'ماساژ',
    'medical': 'پزشکی', 'nails': 'ناخن', 'other': 'سایر',
    'pet-services': 'خدمات حیوانات خانگی', 'physical-therapy': 'فیزیوتراپی',
    'spa-and-wellness': 'اسپا و تندرستی', 'tattoo-and-piercing': 'تاتو و پیرسینگ',
}

class TreatmentParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.key = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'li' and attrs.get('role') == 'option':
            self.key = attrs.get('data-key')
            self.text = []

    def handle_data(self, text):
        if self.key:
            self.text.append(text)

    def handle_endtag(self, tag):
        if tag == 'li' and self.key:
            self.items.append((self.key, ' '.join(' '.join(self.text).split())))
            self.key = None

def sql(value):
    return "N'" + value.replace("'", "''") + "'"

parser = TreatmentParser()
parser.feed(Path(sys.argv[1]).read_text(encoding='utf-8'))
assert len(parser.items) == len({key for key, _ in parser.items}) == 869
rows = []
for order, (key, name) in enumerate(parser.items):
    group = key.split(':', 1)[1].split('/', 1)[0]
    rows.append('(' + ', '.join((sql(key), sql(group), sql(GROUPS[group]), sql(name), str(order))) + ')')
target = Path('src/prisma/migrations/20261030140000_add_treatment_types/migration.sql')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text('''BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[TreatmentType] (
    [id] NVARCHAR(120) NOT NULL,
    [groupSlug] NVARCHAR(64) NOT NULL,
    [groupName] NVARCHAR(100) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [sortOrder] INT NOT NULL,
    CONSTRAINT [TreatmentType_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [TreatmentType_groupSlug_sortOrder_idx] ON [dbo].[TreatmentType]([groupSlug], [sortOrder]);
INSERT INTO [dbo].[TreatmentType] ([id], [groupSlug], [groupName], [name], [sortOrder]) VALUES
''' + ',\n'.join(rows) + ''';
ALTER TABLE [dbo].[BusinessService] ADD [treatmentTypeId] NVARCHAR(120);
ALTER TABLE [dbo].[BusinessService] ADD CONSTRAINT [BusinessService_treatmentTypeId_fkey] FOREIGN KEY ([treatmentTypeId]) REFERENCES [dbo].[TreatmentType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
''', encoding='utf-8')
print(f'Wrote {len(rows)} treatment types to {target}')
