using UnityEngine;

public class Combatant : MonoBehaviour
{
    public string id;
    public bool isPlayer;
    public float health;
    public float maxHealth;
    public float armor;
    public float speed;
    public int kills;
    public bool alive = true;
    public WeaponDef weapon;
    public float cooldown;

    [HideInInspector]
    public CharacterController controller;

    public void ApplyDamage(float amount)
    {
        if (!alive) return;
        float dmg = amount;
        if (armor > 0f)
        {
            float absorbed = Mathf.Min(armor, dmg * 0.6f);
            armor -= absorbed;
            dmg -= absorbed;
        }
        health -= dmg;
        if (health <= 0f)
        {
            alive = false;
        }
    }
}
