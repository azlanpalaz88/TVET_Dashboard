#!/usr/bin/env python3
"""Tukar eksport CSV respons Google Forms ke skema CSV dashboard. Python standard library sahaja.
Cara guna: python TVET_Wanita_Normalisasi_Respons.py respons_google_forms.csv output_dashboard.csv
"""
import csv, re, sys
SCHEMA = ['respondent_id', 'consent', 'eligible', 'age_group', 'state', 'institution_type', 'qualification', 'programme', 'graduation_year', 'internship', 'internship_duration', 'career_guidance', 'employment_status', 'employment_sector', 'employment_type', 'job_match', 'monthly_income_rm', 'first_job_delay', 'job_search_duration', 'nonemployment_reason', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'B01', 'B02', 'B03', 'main_barrier']
EMP = ['Bekerja sepenuh masa', 'Bekerja separuh masa', 'Bekerja sendiri']
WORK_FIELDS = ['employment_sector', 'employment_type', 'job_match', 'monthly_income_rm', 'first_job_delay']
NO_WORK_FIELDS = ['job_search_duration', 'nonemployment_reason']

def norm(path_in, path_out):
    with open(path_in,encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        cols={}
        for header in reader.fieldnames or []:
            m=re.match(r'^\[([A-Za-z][A-Za-z0-9_]*)\]', header.strip())
            if m and m.group(1) in SCHEMA: cols[m.group(1)]=header
        if 'consent' not in cols or 'eligible' not in cols or 'employment_status' not in cols:
            raise ValueError('Kolum [consent], [eligible] atau [employment_status] tiada. Gunakan eksport CSV Google Form yang sepadan.')
        clean=[]
        skipped=0
        for raw in reader:
            rec={col: (raw.get(cols[col], '').strip() if col in cols else '') for col in SCHEMA}
            if rec['consent']!='Ya, saya bersetuju' or rec['eligible']!='Ya':
                skipped+=1
                continue
            rec['respondent_id']='TVETW-R{:05d}'.format(len(clean)+1)
            if rec['employment_status'] in EMP:
                for field in NO_WORK_FIELDS:rec[field]=''
            else:
                for field in WORK_FIELDS:rec[field]=''
            for b in ['B01','B02','B03']:
                if rec[b]=='Tidak berkenaan':rec[b]='Tidak berkenaan'
            clean.append(rec)
    with open(path_out,'w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=SCHEMA)
        writer.writeheader(); writer.writerows(clean)
    print('Respons sah:',len(clean),'| Tiada persetujuan/tidak layak:',skipped)

if __name__=='__main__':
    if len(sys.argv)!=3:sys.exit('Guna: python TVET_Wanita_Normalisasi_Respons.py input.csv output.csv')
    norm(sys.argv[1],sys.argv[2])
